const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { createUser, authenticateUser } = require('./auth');
const { spawn } = require('child_process');
const { ipcRenderer } = require('electron');

let mainWindow;

function createWindow() {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        show: false // Don't show the window until it's ready
    });

    // Load the login page first
    mainWindow.loadFile('offline/login.html');

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Handle window close
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Create window when Electron is ready
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// Handle login attempts
ipcMain.on('login-attempt', (event, { username, password }) => {
    const result = authenticateUser(username, password);
    if (result.success) {
        // Load the main chat interface
        mainWindow.loadFile('offline/index.html');
    }
    event.reply('auth-response', result);
});

// Handle signup attempts
ipcMain.on('signup-attempt', (event, { username, email, password }) => {
    const result = createUser(username, email, password);
    if (result.success) {
        // Automatically log in the user after successful signup
        const loginResult = authenticateUser(username, password);
        if (loginResult.success) {
            mainWindow.loadFile('offline/index.html');
        }
    }
    event.reply('auth-response', result);
});

// Handle chat messages
ipcMain.on('chat-message', (event, message) => {
    const pythonProcess = spawn('python', ['offline/llm_model.py', message]);
    
    let response = '';
    
    pythonProcess.stdout.on('data', (data) => {
        response += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
        console.error(`Error: ${data}`);
    });
    
    pythonProcess.on('close', (code) => {
        event.reply('chat-response', response.trim());
    });
});

// Load chat history when the window loads
async function loadChatHistory() {
    try {
        const response = await fetch('http://localhost:5000/history');
        const data = await response.json();
        if (data.history) {
            // Clear existing messages
            document.getElementById('chat-messages').innerHTML = '';
            // Add each message from history
            data.history.forEach(entry => {
                addMessage(entry.message, entry.sender === 'user');
            });
        }
    } catch (error) {
        console.error('Failed to load chat history:', error);
    }
}

// Add message to chat UI
function addMessage(text, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    messageDiv.innerHTML = isUser ? text : formatBotMessage(text);
    document.getElementById('chat-messages').appendChild(messageDiv);
    messageDiv.scrollIntoView({ behavior: 'smooth' });
}

// Send message to Flask backend
async function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    if (!message) return;

    // Add user message to UI
    addMessage(message, true);
    messageInput.value = '';

    try {
        // Show thinking indicator
        document.getElementById('thinking-indicator').style.display = 'block';

        // Send message to Flask backend
        const response = await fetch('http://localhost:5000/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });

        const data = await response.json();
        
        // Hide thinking indicator
        document.getElementById('thinking-indicator').style.display = 'none';

        if (data.error) {
            addMessage('Error: ' + data.error, false);
        } else {
            addMessage(data.response, false);
        }
    } catch (error) {
        console.error('Failed to send message:', error);
        document.getElementById('thinking-indicator').style.display = 'none';
        addMessage('Error: Failed to get response from server', false);
    }
}

// Format bot message (your existing formatBotMessage function)
function formatBotMessage(message) {
    // ... existing formatBotMessage implementation ...
    return message;
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    loadChatHistory();
    
    // Add event listener for Enter key
    document.getElementById('message-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Add event listener for send button
    document.querySelector('button').addEventListener('click', sendMessage);
});

// Export functions for use in other files
module.exports = {
    addMessage,
    sendMessage,
    loadChatHistory
}; 