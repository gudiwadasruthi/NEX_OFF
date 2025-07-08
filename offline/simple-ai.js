// Simple rule-based AI for demonstration

function generateResponse(prompt) {
    const text = prompt.toLowerCase().trim();

    // Greetings
    if (/^(hi|hello|hey|good morning|good afternoon|good evening)/.test(text)) {
        return 'Hello! How can I help you today?';
    }

    // Farewells
    if (/(bye|goodbye|see you|farewell|exit|quit)/.test(text)) {
        return 'Goodbye! Have a great day!';
    }

    // Gratitude
    if (/(thanks|thank you|thankyou|thx|appreciate)/.test(text)) {
        return "You're welcome! Is there anything else I can help you with?";
    }

    // Name
    if (text.includes('your name') || text.includes('who are you')) {
        return "I'm your offline AI assistant.";
    }

    // Time
    if (text.includes('time')) {
        return `The current time is ${new Date().toLocaleTimeString()}.`;
    }

    // Date
    if (text.includes('date') || text.includes('day')) {
        return `Today's date is ${new Date().toLocaleDateString()}.`;
    }

    // Help
    if (text.includes('help') || text.includes('what can you do')) {
        return 'You can ask me about the time, date, simple math, or just say hello!';
    }

    // Simple math
    const mathMatch = text.match(/what is ([0-9]+) ?([\+\-\*\/]) ?([0-9]+)/);
    if (mathMatch) {
        const a = parseFloat(mathMatch[1]);
        const op = mathMatch[2];
        const b = parseFloat(mathMatch[3]);
        let result;
        switch (op) {
            case '+': result = a + b; break;
            case '-': result = a - b; break;
            case '*': result = a * b; break;
            case '/': result = b !== 0 ? a / b : 'undefined (division by zero)'; break;
        }
        return `The answer is ${result}.`;
    }

    // Weather (static response)
    if (text.includes('weather')) {
        return "I'm offline, so I can't check the weather, but I hope it's nice where you are!";
    }

    // Acknowledgment
    if (/(ok|okay|alright|sure|fine|got it)/.test(text)) {
        return "Is there anything else you'd like to know?";
    }

    // Nothing/None
    if (/(nothing|none|nope|no thanks|no thank you)/.test(text)) {
        return "Alright! Let me know if you need anything else.";
    }

    // Fallback
    return "I'm not sure how to answer that yet, but I'm learning! Try asking about the time, date, or a simple math question like 'what is 2 + 2'.";
} 