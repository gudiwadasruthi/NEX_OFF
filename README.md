
<a id="nex_off---ai-powered-chatbot-with-offline-capabilities"></a>

<p align="center">
  <img src="assets/banner.gif" alt="NEX_OFF Banner" width="85%">
  
</p>

<h1 align="center">NEX_OFF 🤖</h1>
<p align="center">
AI-Powered Offline-First Chatbot with Document Intelligence
</p>

<p align="center">
  <img src="https://img.shields.io/badge/python-3.8%2B-blue">
  <img src="https://img.shields.io/badge/electron-desktop-success">
  <img src="https://img.shields.io/badge/offline--first-yes-purple">
  <img src="https://img.shields.io/badge/docker-supported-informational">
  <img src="https://img.shields.io/badge/license-MIT-orange">
</p>

## Table of Contents
- [💡 About the Project](#about-the-project)
- [⚡ Quick Start](#quick-start)
- [✨ Features](#features)
- [🖥️ Frontend](#frontend)
- [⚙️ Backend](#backend)
- [🚀 Getting Started](#getting-started)
- [🎥 Demo & Screenshots](#demo--screenshots)
- [🧠 System Architecture](#system-architecture)
- [📴 Offline vs Online Capabilities](#offline-vs-online-capabilities)
- [📊 Results & Use Cases](#results--use-cases)
- [🔒 Security & Privacy](#security--privacy)
- [🚀 Roadmap](#roadmap)
- [🛠️ Run Backend (Docker)](#run-backend-docker)
- [📦 Deployment](#deployment)
- [🤝 Contributing](#contributing)
- [🙏 Acknowledgements](#acknowledgements)
- [📜 License](#license)

## ⚡ Quick Start

```bash
git clone <repository-url>
cd NEX_OFF
python -m venv .venv
.venv\Scripts\activate
pip install -r offline/requirements.txt
python offline/app.py
npm install
npm start
```

Open the desktop app and start chatting offline 🚀

<p align="right">(<a href="#nex_off---ai-powered-chatbot-with-offline-capabilities">⬆ Back to top</a>)</p>

## 💡 About the Project
NEX_OFF is an advanced AI-powered chatbot application that combines the power of local processing with cloud-based AI capabilities. Built with a modern tech stack, it offers seamless document processing, intelligent question answering, and natural language understanding both online and offline.

## 🎥 Demo & Screenshots

### 🔐 Login Page 
![Login Page – Demo](assets/screenshots/login-demo.gif)

### Online Mode in Action
![Online Mode – light mode](assets/screenshots/online-1.png)
![Online Mode – dark mode](assets/screenshots/online-2.png)

### PDF Upload & Question Answering
![PDF QA – light mode](assets/screenshots/pdf-qa-1.png)
![PDF QA – dark mode](assets/screenshots/pdf-qa-2.png)

### Offline Mode in Action
![Offline Mode – light mode](assets/screenshots/offline-1.png)
![Offline Mode – dark mode](assets/screenshots/offline-2.png)

<p align="right">(<a href="#nex_off---ai-powered-chatbot-with-offline-capabilities">⬆ Back to top</a>)</p>

## ✨ Features
- **Document Intelligence**: Upload and process PDFs with advanced text extraction
- **Hybrid AI**: Combine local RAG (Retrieval-Augmented Generation) with cloud-based LLMs
- **Offline-First**: Full functionality without internet connectivity
- **Speech Recognition**: Built-in speech-to-text using Vosk
- **Cross-Platform**: Desktop application built with Electron.js
- **Secure**: Local data storage with SQLite
- **Responsive UI**: Clean, modern interface built with Bootstrap

## 📴 Offline vs Online Capabilities

| Feature | Offline | Online |
|------|------|------|
| Chat Interface | ✅ | ✅ |
| PDF Upload & Parsing | ✅ | ✅ |
| RAG-based QA | ✅ | ✅ |
| Cloud LLM (Groq) | ❌ | ✅ |
| Local Storage | ✅ | ✅ |

<p align="right">(<a href="#nex_off---ai-powered-chatbot-with-offline-capabilities">⬆ Back to top</a>)</p>

## 🖥️ Frontend
- **Framework**: Electron.js
- **UI**: HTML5, CSS3, JavaScript (ES6+)
- **Libraries**:
  - Bootstrap 5.x - Responsive design
  - PDF.js - PDF rendering
  - Socket.io - Real-time communication

## 🧠 System Architecture

![Architecture Diagram](assets/architecture.png)

### Workflow Overview
1. User interacts via Electron desktop UI
2. Frontend communicates with Flask backend
3. PDFs are processed and chunked locally
4. RAG engine retrieves relevant context
5. Local or cloud LLM generates responses
6. SQLite stores conversation & metadata
7. Vosk enables offline speech input

<p align="right">(<a href="#nex_off---ai-powered-chatbot-with-offline-capabilities">⬆ Back to top</a>)</p>

## ⚙️ Backend
- **Language**: Python 3.8+
- **Framework**: Flask
- **AI/ML**:
  - RAG (Retrieval-Augmented Generation)
  - Groq LLM integration
  - Vosk for speech recognition
- **Database**: SQLite
- **Dependencies**:
  - Flask-CORS
  - PyPDF2
  - SQLAlchemy

> Configure cloud LLM access by setting `GROQ_API_KEY` in your environment or editing `offline/gro.py`. Choose a supported model (e.g., `llama-3.1-8b-instant`).

## 🚀 Getting Started

### Prerequisites
- Python 3.8 or higher
- Node.js 14+ and npm
- Git
- 8GB RAM (16GB recommended for large models)
- 2GB+ free disk space

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd NEX_OFF
   ```

2. Set up Python environment:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate  # On Windows
   pip install -r offline/requirements.txt
   ```

3. Install Node.js dependencies:
   ```bash
   npm install
   ```

### Running the Application
1. Start the backend server:
   ```bash
   python offline/app.py
   ```

2. In a new terminal, start the Electron app:
   ```bash
   npm start
   ```

## 📊 Results & Use Cases

- Ask questions from large PDFs without internet
- Fast local responses using RAG
- Accurate speech-to-text in offline mode
- Seamless switching between offline and online AI
- Ideal for research, academics, and private data analysis

<p align="right">(<a href="#nex_off---ai-powered-chatbot-with-offline-capabilities">⬆ Back to top</a>)</p>

## 🛠️ Run Backend (Docker)

### Build the Docker image:
```bash
docker build -t nexoff-backend .
```

### Run the container:
```bash
docker run -p 5000:5000 nexoff-backend
```

## 📦 Deployment
For production deployment, consider the following:
- Use Gunicorn or uWSGI for production WSGI server
- Set up Nginx as a reverse proxy
- Configure environment variables for sensitive data
- Enable HTTPS with Let's Encrypt

## 🔒 Security & Privacy

- All documents are processed locally
- No PDF data is uploaded without user consent
- SQLite database stored on local machine
- Offline mode ensures complete data privacy
- No third-party tracking or analytics

<p align="right">(<a href="#nex_off---ai-powered-chatbot-with-offline-capabilities">⬆ Back to top</a>)</p>

## 🚀 Roadmap

- 🔌 Fully local LLM integration (no cloud dependency)
- 🌍 Multi-language voice support
- 📊 Conversation analytics dashboard
- 🧠 Model fine-tuning using local knowledge base
- 🐧 Linux & macOS installer packages

<p align="right">(<a href="#nex_off---ai-powered-chatbot-with-offline-capabilities">⬆ Back to top</a>)</p>

