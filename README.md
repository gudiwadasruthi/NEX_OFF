# AI Chatbot Project (Offline, Online, and PDF Chat)

This project is a multi-modal AI assistant that works fully offline, online, and with PDF documents. It is organized for clarity and ease of use, supporting both text and voice chat, as well as document-based Q&A.

## Project Structure

- **offline/**: All files for the offline AI assistant (no internet required)
- **online/**: All files for the online/cloud-based AI assistant
- **chat_with_pdf/**: All files for the PDF chat feature (ask questions about PDFs)
- **assets/**, **knowledge/**, **lib/**, **local_models/**, **uploaded_pdfs/**: Shared resources, models, and data
- **package.json**, **package-lock.json**: Project dependencies and Electron app configuration

## Features

- 🧠 **Offline AI Chat**: Local LLM-based chat, no internet needed
- 🌐 **Online AI Chat**: Cloud-based chat (if enabled)
- 📄 **PDF Chat**: Ask questions about uploaded PDF documents
- 🔒 **Privacy**: All offline features run locally, no data leaves your device

---

## Setup Instructions

### 1. Prerequisites
- **Node.js** (v16+ recommended)
- **Python** (v3.8+ recommended)
- **pip** (Python package manager)
- **8GB RAM** (16GB recommended for large models)
- **2GB+ free disk space**

### 2. Install Node/Electron Dependencies
From the project root:
```bash
npm install
```

### 3. Install Python Dependencies
From the `offline/` directory:
```bash
cd offline
pip install -r requirements.txt
```

### 4. Prepare Local Models (Offline Mode)
- Download the required Hugging Face model (e.g., `all-MiniLM-L6-v2`) and place it in `local_models/` as described in the code comments.
- Ensure the path in your Python code matches the local model directory.
- Set the environment variable for offline transformers:
  - On Windows (CMD):
    ```cmd
    set TRANSFORMERS_OFFLINE=1
    ```
  - On PowerShell:
    ```powershell
    $env:TRANSFORMERS_OFFLINE="1"
    ```

### 5. Running the App
- **Offline/Electron App:**
  - From the project root:
    ```bash
    npm start
    ```
- **PDF Chat (standalone):**
  - Open `chat_with_pdf/pdf_chat_feature/pdf_chat.html` in your browser, or use the Electron app's navigation.
- **API/Backend (if needed):**
  - From `offline/`:
    ```bash
    python app.py
    ```

---

## Folder Details

### offline/
- Electron main process, backend API, and all offline chat logic
- Python scripts for LLM, RAG, and voice features

### online/
- HTML/JS for online chat (cloud-based)

### chat_with_pdf/
- PDF chat UI and backend scripts
- `pdf_chat_feature/`: Main PDF chat logic and scripts
- `sentence_chunker.py`, `semantic_chunker.py`: For chunking and embedding PDFs

### assets/, knowledge/, lib/, local_models/, uploaded_pdfs/
- Shared static files, knowledge bases, PDF.js, local ML models, and uploaded PDFs

---

## Troubleshooting & FAQ

- **Model not found / No internet:**
  - Ensure the model is downloaded and the path is correct in your code.
  - Set `TRANSFORMERS_OFFLINE=1` to prevent internet access attempts.
- **Path issues (Windows):**
  - If your path has spaces or parentheses, use quotes or escape them as needed.
- **Voice not working:**
  - Check your microphone and speaker permissions.
- **PDF chat errors:**
  - Ensure all dependencies are installed and the PDF is not corrupted.

---

## License
MIT License

## Contributing
Contributions are welcome! Please open an issue or submit a pull request. 