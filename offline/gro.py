import sys

# Force UTF-8 encoding for standard output to handle emojis on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

import requests
import json
import re
import html
import os

def _load_env():
    for env_path in [".env", os.path.join(os.path.dirname(__file__), ".env")]:
        try:
            if os.path.exists(env_path):
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        s = line.strip()
                        if not s or s.startswith("#") or "=" not in s:
                            continue
                        k, v = s.split("=", 1)
                        k = k.strip()
                        v = v.strip().strip('"').strip("'")
                        os.environ.setdefault(k, v)
        except Exception as e:
            print(f"Warning: could not load env from {env_path}: {e}", file=sys.stderr)

_load_env()

API_KEY = os.getenv("GROQ_API_KEY", "").strip()
MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant").strip() or "llama-3.1-8b-instant"
API_URL = "https://api.groq.com/openai/v1/chat/completions"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Store chat history
chat_histories = {}

def load_chat_history():
    try:
        if os.path.exists('chat_history.json'):
            with open('chat_history.json', 'r') as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading chat history: {e}", file=sys.stderr)
    return {}

def save_chat_history():
    try:
        with open('chat_history.json', 'w') as f:
            json.dump(chat_histories, f)
    except Exception as e:
        print(f"Error saving chat history: {e}", file=sys.stderr)

def format_response(text):
    # Clean up special characters and formatting
    text = text.replace('•', '•')  # Replace special bullet character
    text = re.sub(r'\\([^]+)\\*', r'\1', text)  # Remove ** from headers
    text = re.sub(r'\([^]+)\*', r'\1', text)  # Remove single *
    
    # Split into lines for processing
    lines = text.splitlines()
    html_lines = []
    in_list = False
    list_level = 0
    current_paragraph = []

    for line in lines:
        stripped = line.strip()
        
        # Skip empty lines
        if not stripped:
            if current_paragraph:
                html_lines.append(f'<p>{" ".join(current_paragraph)}</p>')
                current_paragraph = []
            if in_list:
                html_lines.append('</ul>')
                in_list = False
            continue
        
        # Calculate indentation level
        indent = len(line) - len(line.lstrip())
        
        # Handle section headers (lines ending with colon)
        if re.match(r'^[^•]+:\s*$', stripped):
            if current_paragraph:
                html_lines.append(f'<p>{" ".join(current_paragraph)}</p>')
                current_paragraph = []
            header_text = stripped.rstrip(':').strip()
            html_lines.append(f'<p class="section-header">{header_text}:</p>')
            continue
        
        # Handle bullet points
        if stripped.startswith('•') or stripped.startswith('•'):
            if current_paragraph:
                html_lines.append(f'<p>{" ".join(current_paragraph)}</p>')
                current_paragraph = []
            
            content = stripped[1:].strip()  # Remove bullet and trim
            
            if not in_list or indent <= list_level:
                if in_list:
                    html_lines.append('</ul>')
                html_lines.append('<ul class="bullet-list">')
                in_list = True
            elif indent > list_level:
                html_lines.append('<ul class="sub-bullet-list">')
            elif indent < list_level:
                html_lines.append('</ul>')
            
            list_level = indent
            html_lines.append(f'<li>{content}</li>')
            continue
        
        # Regular text
        if in_list:
            html_lines.append('</ul>')
            in_list = False
        current_paragraph.append(stripped)
    
    # Clean up any remaining content
    if current_paragraph:
        html_lines.append(f'<p>{" ".join(current_paragraph)}</p>')
    if in_list:
        html_lines.append('</ul>')
    
    # Join all lines and clean up extra spacing
    text = '\n'.join(html_lines)
    text = re.sub(r'\n\s*\n', '\n', text)
    text = re.sub(r'<p>\s*</p>', '', text)
    text = re.sub(r'<ul>\s*</ul>', '', text)
    
    return text

def query_groq(message, session_id="default", format_type="web"):
    global chat_histories
    # Load chat history at the start of each query
    chat_histories = load_chat_history()
    if not API_KEY:
        error_msg = "Configuration error: GROQ_API_KEY is not set"
        print(error_msg, file=sys.stderr)
        return error_msg
    
    # Initialize or get chat history for this session
    if session_id not in chat_histories:
        chat_histories[session_id] = []
    
    # Add user message to history
    chat_histories[session_id].append({"role": "user", "content": message})
    
    system_prompt = """You are a helpful, friendly AI assistant. Keep your answers short, clear and to the point.

- For greetings and casual chat: reply briefly and conversationally. No lists or sections needed.
- For simple factual questions: give a direct, concise answer in 1-3 sentences.
- Only use bullet points or sections when the user explicitly asks for a detailed breakdown or step-by-step guide.
- Never pad answers with unnecessary categories, headers, or sub-sections.
- Do not repeat or rephrase the question back to the user."""

    # Prepare messages with history
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(chat_histories[session_id][-5:])  # Include last 5 messages for context

    data = {
        "model": MODEL,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 4000
    }

    try:
        response = requests.post(API_URL, headers=headers, json=data)
        response.raise_for_status()
        result = response.json()

        if "choices" in result and len(result["choices"]) > 0:
            reply = result["choices"][0]["message"]["content"]
            # Add bot response to history
            chat_histories[session_id].append({"role": "assistant", "content": reply})
            # Keep only last 10 messages to prevent history from growing too large
            if len(chat_histories[session_id]) > 10:
                chat_histories[session_id] = chat_histories[session_id][-10:]
            # Save chat history after each successful response
            save_chat_history()
            
            # Return formatted response based on format type
            if format_type == "web":
                return format_response(reply)
            else:
                return format_console_output(reply)
        else:
            return "Error: Unexpected response format from API"

    except requests.exceptions.HTTPError as e:
        status_code = e.response.status_code if getattr(e, 'response', None) is not None else 'N/A'
        # Try to extract detailed error information from the response body
        detail = None
        if getattr(e, 'response', None) is not None:
            try:
                detail = e.response.json()
            except Exception:
                try:
                    detail = e.response.text
                except Exception:
                    detail = None
        error_msg = f"API error {status_code}: {detail}"
        print(error_msg, file=sys.stderr)
        return error_msg
    except requests.exceptions.RequestException as e:
        # Generic network/requests error fallback
        error_msg = f"Error communicating with API: {str(e)}"
        print(error_msg, file=sys.stderr)
        return error_msg
    except json.JSONDecodeError:
        error_msg = "Error: Invalid JSON response from API"
        print(error_msg, file=sys.stderr)
        return error_msg
    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        print(error_msg, file=sys.stderr)
        return error_msg

def format_console_output(text):
    # Remove HTML tags and decode HTML entities
    text = re.sub(r'<[^>]+>', '', text)
    text = html.unescape(text)
    return text.strip()

class GroqLLM:
    def _init_(self):
        self.api_key = API_KEY
        self.model = MODEL
        self.api_url = API_URL
        self.headers = headers

    def get_response(self, message, format_type="web"):
        return query_groq(message, format_type=format_type)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Error: No message provided", file=sys.stderr)
        sys.exit(1)

    user_input = sys.argv[1]
    response = query_groq(user_input, format_type="console")
    print(response, flush=True)