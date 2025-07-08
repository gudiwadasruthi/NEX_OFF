const { app, BrowserWindow, ipcMain, systemPreferences } = require('electron');
const path = require('path');
const { createUser, authenticateUser } = require('./auth');
const { spawn } = require('child_process');
const { ipcRenderer } = require('electron');

let mainWindow;
let currentSpeechProcess = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
        show: false
    });

    mainWindow.loadFile('offline/title.html');

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Add zoom keyboard shortcuts
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.control && input.key === '=') {
            mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() + 0.5);
            event.preventDefault();
        }
        if (input.control && input.key === '-') {
            mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() - 0.5);
            event.preventDefault();
        }
        if (input.control && input.key === '0') {
            mainWindow.webContents.setZoomLevel(0);
            event.preventDefault();
        }
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Handle login attempts
ipcMain.on('login-attempt', (event, { username, password }) => {
    const result = authenticateUser(username, password);
    if (result.success) {
        mainWindow.loadFile('offline/index.html');
    }
    event.reply('auth-response', result);
});

// Handle signup attempts
ipcMain.on('signup-attempt', (event, { username, email, password }) => {
    const result = createUser(username, email, password);
    if (result.success) {
        const loginResult = authenticateUser(username, password);
        if (loginResult.success) {
            mainWindow.loadFile('offline/index.html');
        }
    }
    event.reply('auth-response', result);
});

// Handle chat messages using local Python process
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

// Handle switching to online model
ipcMain.on('load-online-model', () => {
    mainWindow.loadFile('online/online.html');
});

// Handle switching to offline model
ipcMain.on('load-offline-model', () => {
    mainWindow.loadFile('offline/index.html');
});

// Call gro.py for online model
ipcMain.on('online-message', (event, message) => {
    console.log('Received message:', message);
    const pythonProcess = spawn('python', ['offline/gro.py', message]);

    let response = '';

    pythonProcess.stdout.on('data', (data) => {
        response += data.toString();
        console.log('Received data from Python:', data.toString());
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Groq Error: ${data}`);
    });

    pythonProcess.on('close', () => {
        console.log('Sending response:', response.trim());
        event.reply('online-response', response.trim());
    });
});