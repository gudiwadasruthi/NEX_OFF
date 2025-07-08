import sqlite3
from datetime import datetime

def init_db():
    conn = sqlite3.connect('chat_history.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender TEXT NOT NULL,
            message TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

def save_message(sender, message):
    conn = sqlite3.connect('chat_history.db')
    c = conn.cursor()
    c.execute('INSERT INTO history (sender, message, timestamp) VALUES (?, ?, ?)',
              (sender, message, datetime.now().isoformat()))
    conn.commit()
    conn.close()

def get_history(limit=50):
    conn = sqlite3.connect('chat_history.db')
    c = conn.cursor()
    c.execute('SELECT sender, message, timestamp FROM history ORDER BY id DESC LIMIT ?', (limit,))
    rows = c.fetchall()
    conn.close()
    return [{'sender': row[0], 'message': row[1], 'timestamp': row[2]} for row in rows][::-1] 