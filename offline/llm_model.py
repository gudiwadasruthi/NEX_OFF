import datetime
import random
import re
import sys
from rag_engine import SentenceRAGEngine  # ✅ USE NEW RAG SYSTEM

class SimpleLLM:
    def __init__(self):
        self.model_name = "SimpleLLM"
        self.version = "1.0"
        self.kb = SentenceRAGEngine()  # ✅ Changed to SentenceRAGEngine

    def generate_response(self, prompt):
        text = prompt.lower().strip()

       # Greetings
        if re.match(r'^(hi|hello|hey|good morning|good afternoon|good evening)', text):
            responses = [
                "Hello! How can I assist you today?",
                "Hi there! What can I do for you?",
                "Hey! Need any help?",
                "Good to see you! How can I help?",
                "Welcome! How may I assist you today?"
            ]
            return random.choice(responses)

        # Farewells
        if re.search(r'(bye|goodbye|see you|farewell|exit|quit)', text):
            responses = [
                "Goodbye! Have a great day!",
                "See you later!",
                "Farewell! Come back soon!",
                "Take care! Signing off now.",
                "Catch you later!"
            ]
            return random.choice(responses)

        # Gratitude
        if re.search(r'(thanks|thank you|thankyou|thx|appreciate)', text):
            responses = [
                "You're welcome!",
                "No problem at all!",
                "Glad I could help!",
                "Anytime!",
                "Always happy to assist!"
            ]
            return random.choice(responses)

        # Name
        if 'your name' in text or 'who are you' in text:
            responses = [
                "I'm your offline AI assistant.",
                "I'm a chatbot here to assist you.",
                "I'm your virtual helper!",
                "I'm a simple language model trained to chat with you."
            ]
            return random.choice(responses)

        # Time
        if 'time' in text:
            return f"The current time is {datetime.datetime.now().strftime('%I:%M:%S %p')}."

        # Date
        if 'date' in text or 'day' in text:
            return f"Today's date is {datetime.datetime.now().strftime('%d/%m/%Y')}."

        # How are you
        if re.search(r'how are you', text):
            responses = [
                "I'm just code, but I'm running smoothly!",
                "I'm functioning as expected. How can I assist you?",
                "I'm great! Thanks for asking.",
                "All systems are operational. How can I help you?"
            ]
            return random.choice(responses)


        # Help
        if 'help' in text or 'what can you do' in text:
            return 'You can ask me about the time, date, simple math, or questions from my knowledge base!'

        # Simple math
        math_match = re.search(r'what is (\d+)\s*([\+\-*/])\s*(\d+)', text) or re.search(r'(\d+)\s*([\+\-*/])\s*(\d+)', text)
        if math_match:
            a = int(math_match.group(1))
            op = math_match.group(2)
            b = int(math_match.group(3))
            result = None
            if op == '+':
                result = a + b
            elif op == '-':
                result = a - b
            elif op == '*':
                result = a * b
            elif op == '/':
                result = a / b if b != 0 else 'undefined (division by zero)'
            return f"The answer is {result}."

        # Weather (static response)
        if 'weather' in text:
            return "I'm offline, so I can't check the weather, but I hope it's nice where you are!"

        # Acknowledgment
        if re.search(r'(ok|okay|alright|sure|fine|got it)', text):
            return "Is there anything else you'd like to know?"

        # Nothing/None
        if re.search(r'(nothing|none|nope|no thanks|no thank you)', text):
            return "Alright! Let me know if you need anything else."

        # --- RAG-Based Knowledge Lookup ---
        answer = self.kb.get_answer(text)
        if answer and not answer.startswith("I'm sorry"):
            return answer

        # Fallback
        return "I'm not sure how to answer that yet, but I'm learning! Try asking about the time, date, or a simple math question like 'what is 2 + 2'."

    def train(self, training_data):
        """ Placeholder for future training functionality """
        pass

    def save_model(self, path):
        """ Placeholder for saving model state """
        pass

    def load_model(self, path):
        """ Placeholder for loading model state """
        pass


if __name__ == "__main__":
    llm = SimpleLLM()

    if len(sys.argv) > 1:
        user_input = sys.argv[1]
        response = llm.generate_response(user_input)
        print(response)
        sys.stdout.flush()
    else:
        # Test mode
        test_queries = [
            "Hello!",
            "What time is it?",
            "What is 5 + 3?",
            "Thank you!",
            "Goodbye!",
            "What is Python?",
            "Explain artificial intelligence",
            "Tell me about binary search tree"
        ]

        for query in test_queries:
            print(f"Query: {query}")
            print(f"Response: {llm.generate_response(query)}\n")
            sys.stdout.flush()
