const express = require('express');
const cors = require('cors');
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || './data';

let db;
const DB_PATH = path.join(DATA_DIR, 'notes.db');

// Initialize database
async function initDatabase() {
    const SQL = await initSqlJs();
    
    // Create data directory if needed
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    // Load existing database or create new
    if (fs.existsSync(DB_PATH)) {
        const buffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(buffer);
        console.log('📂 Loaded existing database');
    } else {
        db = new SQL.Database();
        console.log('🆕 Created new database');
    }
    
    // Initialize tables
    db.run(`
        CREATE TABLE IF NOT EXISTS notes (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            title TEXT,
            content TEXT,
            audioData TEXT,
            audioDuration REAL,
            transcription TEXT,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL
        )
    `);
    
    saveDatabase();
}

// Save database to file
function saveDatabase() {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Cache-busting: no-cache for JS/CSS/HTML so updates are immediate
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js') || filePath.endsWith('.css') || filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, must-revalidate');
        }
    }
}));

// Helper: Run a parameterized SELECT and return array of objects
function queryAll(sql, params = []) {
    const stmt = db.prepare(sql);
    if (params.length) stmt.bind(params);
    const results = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
}

// API Routes

// Get all notes (with optional date filter)
app.get('/api/notes', (req, res) => {
    try {
        const { date, type } = req.query;
        let query = 'SELECT * FROM notes';
        const conditions = [];
        const params = [];
        
        if (date) {
            conditions.push('date(createdAt) = date(?)');
            params.push(date);
        }
        if (type) {
            conditions.push('type = ?');
            params.push(type);
        }
        
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        query += ' ORDER BY createdAt DESC';
        
        const notes = queryAll(query, params);
        res.json(notes);
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ error: 'Failed to fetch notes' });
    }
});

// Get single note
app.get('/api/notes/:id', (req, res) => {
    try {
        const notes = queryAll('SELECT * FROM notes WHERE id = ?', [req.params.id]);
        if (notes.length === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }
        res.json(notes[0]);
    } catch (error) {
        console.error('Error fetching note:', error);
        res.status(500).json({ error: 'Failed to fetch note' });
    }
});

// Create note
app.post('/api/notes', (req, res) => {
    try {
        const { id, type, title, content, audioData, audioDuration, transcription } = req.body;
        const now = new Date().toISOString();
        const noteId = id || `${type}-${Date.now()}`;
        
        db.run(`
            INSERT INTO notes (id, type, title, content, audioData, audioDuration, transcription, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [noteId, type, title || null, content || null, audioData || null, audioDuration || null, transcription || null, now, now]);
        
        saveDatabase();
        
        const notes = queryAll('SELECT * FROM notes WHERE id = ?', [noteId]);
        res.status(201).json(notes[0]);
    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).json({ error: 'Failed to create note' });
    }
});

// Update note
app.put('/api/notes/:id', (req, res) => {
    try {
        const { title, content, transcription } = req.body;
        const now = new Date().toISOString();
        
        // Check if exists
        const existing = queryAll('SELECT id FROM notes WHERE id = ?', [req.params.id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }
        
        // Build update query
        const updates = [];
        const values = [];
        
        if (title !== undefined) {
            updates.push('title = ?');
            values.push(title);
        }
        if (content !== undefined) {
            updates.push('content = ?');
            values.push(content);
        }
        if (transcription !== undefined) {
            updates.push('transcription = ?');
            values.push(transcription);
        }
        
        updates.push('updatedAt = ?');
        values.push(now);
        values.push(req.params.id);
        
        db.run(`UPDATE notes SET ${updates.join(', ')} WHERE id = ?`, values);
        saveDatabase();
        
        const notes = queryAll('SELECT * FROM notes WHERE id = ?', [req.params.id]);
        res.json(notes[0]);
    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({ error: 'Failed to update note' });
    }
});

// Delete note
app.delete('/api/notes/:id', (req, res) => {
    try {
        const existing = queryAll('SELECT id FROM notes WHERE id = ?', [req.params.id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }
        
        db.run('DELETE FROM notes WHERE id = ?', [req.params.id]);
        saveDatabase();
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({ error: 'Failed to delete note' });
    }
});

// Get dates with notes (for calendar)
app.get('/api/dates', (req, res) => {
    try {
        const dates = queryAll(`
            SELECT date(createdAt) as date, COUNT(*) as count
            FROM notes
            GROUP BY date(createdAt)
            ORDER BY date DESC
        `);
        res.json(dates);
    } catch (error) {
        console.error('Error fetching dates:', error);
        res.status(500).json({ error: 'Failed to fetch dates' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve the app for any other route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
initDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`🎙️ Voice Memo Server running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});
