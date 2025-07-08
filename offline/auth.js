const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const USERS_FILE = path.join(__dirname, 'users.json');

// Initialize users file if it doesn't exist
if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify({ users: [] }));
}

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

function loadUsers() {
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data).users;
    } catch (error) {
        console.error('Error loading users:', error);
        return [];
    }
}

function saveUsers(users) {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify({ users }, null, 2));
    } catch (error) {
        console.error('Error saving users:', error);
    }
}

function findUser(username) {
    const users = loadUsers();
    return users.find(user => user.username === username);
}

function createUser(username, email, password) {
    const users = loadUsers();
    
    // Check if username already exists
    if (findUser(username)) {
        return { success: false, message: 'Username already exists' };
    }

    // Create new user
    const newUser = {
        username,
        email,
        password: hashPassword(password),
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);
    return { success: true, message: 'User created successfully' };
}

function authenticateUser(username, password) {
    const user = findUser(username);
    
    if (!user) {
        return { success: false, message: 'Invalid username or password' };
    }

    if (user.password !== hashPassword(password)) {
        return { success: false, message: 'Invalid username or password' };
    }

    return { success: true, message: 'Login successful' };
}

module.exports = {
    createUser,
    authenticateUser
}; 