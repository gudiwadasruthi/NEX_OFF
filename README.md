# NEX_OFF - AI-Powered Chatbot with Offline Capabilities

## Table of Contents
- [💡 About the Project](#-about-the-project)
- [✨ Features](#-features)
- [🖥️ Frontend](#-frontend)
- [⚙️ Backend](#-backend)
- [🚀 Getting Started](#-getting-started)
- [🛠️ Run Backend (Docker)](#-run-backend-docker)
- [📦 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [🙏 Acknowledgements](#-acknowledgements)
- [📜 License](#-license)

## 💡 About the Project
NEX_OFF is an advanced AI-powered chatbot application that combines the power of local processing with cloud-based AI capabilities. Built with a modern tech stack, it offers seamless document processing, intelligent question answering, and natural language understanding both online and offline.

## ✨ Features
- **Document Intelligence**: Upload and process PDFs with advanced text extraction
- **Hybrid AI**: Combine local RAG (Retrieval-Augmented Generation) with cloud-based LLMs
- **Offline-First**: Full functionality without internet connectivity
- **Speech Recognition**: Built-in speech-to-text using Vosk
- **Cross-Platform**: Desktop application built with Electron.js
- **Secure**: Local data storage with SQLite
- **Responsive UI**: Clean, modern interface built with Bootstrap

## 🖥️ Frontend
- **Framework**: Electron.js
- **UI**: HTML5, CSS3, JavaScript (ES6+)
- **Libraries**:
  - Bootstrap 5.x - Responsive design
  - PDF.js - PDF rendering
  - Socket.io - Real-time communication

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
   pip install -r requirements.txt
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

## 🤝 Contributing
Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🙏 Acknowledgements
- [Vosk](https://alphacephei.com/vosk/) for offline speech recognition
- [PDF.js](https://mozilla.github.io/pdf.js/) for PDF rendering
- [Bootstrap](https://getbootstrap.com/) for the UI components
- [Flask](https://flask.palletsprojects.com/) for the backend framework
- [Electron](https://www.electronjs.org/) for cross-platform desktop app

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.

---
*This project is maintained by [Your Name]. For support, please open an issue in the repository.*
