import os
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from database import init_db, save_message, get_history
from rag_engine import RAGEngine
from gro import GroqLLM

app = Flask(__name__)
CORS(app)
init_db()

rag_engine = RAGEngine()

# PDF upload and extract endpoint
@app.route('/upload-pdf', methods=['POST'])
def upload_pdf():
    try:
        if 'pdf' not in request.files:
            return jsonify({'error': 'No PDF file provided'}), 400
        pdf_file = request.files['pdf']
        if pdf_file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        # Ensure upload folder exists
        upload_folder = 'chat_with_pdf/uploaded_pdfs'
        os.makedirs(upload_folder, exist_ok=True)
        save_path = os.path.join(upload_folder, pdf_file.filename)
        pdf_file.save(save_path)
        # Extract text from PDF
        try:
            from PyPDF2 import PdfReader
            reader = PdfReader(save_path)
            text = "\n".join(page.extract_text() or '' for page in reader.pages)
        except Exception as e:
            return jsonify({'error': f'Failed to extract text: {str(e)}'}), 500
        return jsonify({'success': True, 'filename': pdf_file.filename, 'text': text})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat():
    try:
        user_msg = request.json.get('message', '')
        if not user_msg:
            return jsonify({'error': 'No message provided'}), 400
        
        save_message('user', user_msg)
        bot_reply = rag_engine.get_response(user_msg)
        save_message('bot', bot_reply)
        
        return jsonify({'response': bot_reply})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/history', methods=['GET'])
def history():
    try:
        messages = get_history()
        return jsonify({'history': messages})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/delete-message/<int:message_id>', methods=['DELETE'])
def delete_message(message_id):
    try:
        from database import get_db_connection
        conn = get_db_connection()
        conn.execute('DELETE FROM chat_history WHERE id = ?', (message_id,))
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Message deleted.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

# ✅ New: Online UI route
@app.route('/online')
def online_ui():
    return render_template("online.html")

# ✅ New: Groq chat endpoint
@app.route('/groq-chat', methods=['POST'])
def groq_chat():
    try:
        user_msg = request.json.get("message", "")
        model = GroqLLM()
        response = model.get_response(user_msg)
        return jsonify({"response": response})
    except Exception as e:
        return jsonify({"response": f"Error: {str(e)}"})


if __name__ == '__main__':
    app.run(debug=False, port=5000)
