/**
 * Database API wrapper - connects to server instead of IndexedDB
 * Drop-in replacement for the original local-only db.js
 */

const API_BASE = window.location.origin + '/api';

const NotesDB = {
    // Initialize - just check server health
    async init() {
        try {
            const response = await fetch(`${API_BASE}/health`);
            if (!response.ok) throw new Error('Server not healthy');
            console.log('📡 Connected to server');
            return true;
        } catch (error) {
            console.error('❌ Failed to connect to server:', error);
            throw error;
        }
    },

    // Get all notes, optionally filtered by date
    async getAllNotes(date = null) {
        try {
            let url = `${API_BASE}/notes`;
            if (date) {
                url += `?date=${date}`;
            }
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch notes');
            const notes = await response.json();
            
            // Convert for compatibility with existing UI
            return notes.map(note => ({
                ...note,
                audioBlob: note.audioData ? this._base64ToBlob(note.audioData) : null
            }));
        } catch (error) {
            console.error('Error getting notes:', error);
            return [];
        }
    },

    // Get notes for a specific date
    async getNotesByDate(date) {
        return this.getAllNotes(date);
    },

    // Get a single note by ID
    async getNote(id) {
        try {
            const response = await fetch(`${API_BASE}/notes/${id}`);
            if (!response.ok) {
                if (response.status === 404) return null;
                throw new Error('Failed to fetch note');
            }
            const note = await response.json();
            return {
                ...note,
                audioBlob: note.audioData ? this._base64ToBlob(note.audioData) : null
            };
        } catch (error) {
            console.error('Error getting note:', error);
            return null;
        }
    },

    // Save a new note
    async saveNote(note) {
        try {
            // Convert blob to base64 if present
            let audioData = null;
            if (note.audioBlob) {
                audioData = await this._blobToBase64(note.audioBlob);
            }
            
            const response = await fetch(`${API_BASE}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: note.id,
                    type: note.type,
                    title: note.title,
                    content: note.content,
                    audioData: audioData,
                    audioDuration: note.audioDuration,
                    transcription: note.transcription
                })
            });
            
            if (!response.ok) throw new Error('Failed to save note');
            return await response.json();
        } catch (error) {
            console.error('Error saving note:', error);
            throw error;
        }
    },

    // Update an existing note
    async updateNote(id, updates) {
        try {
            const response = await fetch(`${API_BASE}/notes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            
            if (!response.ok) throw new Error('Failed to update note');
            return await response.json();
        } catch (error) {
            console.error('Error updating note:', error);
            throw error;
        }
    },

    // Delete a note
    async deleteNote(id) {
        try {
            const response = await fetch(`${API_BASE}/notes/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Failed to delete note');
            return true;
        } catch (error) {
            console.error('Error deleting note:', error);
            throw error;
        }
    },

    // Get dates that have notes (for calendar)
    async getDatesWithNotes() {
        try {
            const response = await fetch(`${API_BASE}/dates`);
            if (!response.ok) throw new Error('Failed to fetch dates');
            const dates = await response.json();
            return dates.map(d => d.date);
        } catch (error) {
            console.error('Error getting dates:', error);
            return [];
        }
    },

    // Helper: Convert Blob to Base64
    _blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    },

    // Helper: Convert Base64 to Blob
    _base64ToBlob(base64) {
        try {
            const parts = base64.split(';base64,');
            const contentType = parts[0].split(':')[1];
            const raw = window.atob(parts[1]);
            const rawLength = raw.length;
            const uInt8Array = new Uint8Array(rawLength);
            
            for (let i = 0; i < rawLength; ++i) {
                uInt8Array[i] = raw.charCodeAt(i);
            }
            
            return new Blob([uInt8Array], { type: contentType });
        } catch (e) {
            console.error('Error converting base64 to blob:', e);
            return null;
        }
    }
};

// Make it globally available
window.NotesDB = NotesDB;

/**
 * DB Compatibility Layer
 * Maps old DB interface to new NotesDB
 */
const DB = {
    // Initialize database
    async init() {
        return NotesDB.init();
    },
    
    // Get date string in YYYY-MM-DD format
    getDateString(date) {
        return date.toISOString().split('T')[0];
    },
    
    // Get a single note by ID
    async getNote(id) {
        return NotesDB.getNote(id);
    },
    
    // Get all notes for a date
    async getAllNotes(date = null) {
        return NotesDB.getAllNotes(date);
    },
    
    // Get all voice memos (notes with audio)
    async getAllVoiceMemos(date = null) {
        const notes = await NotesDB.getAllNotes(date);
        return notes.filter(n => n.audioData || n.type === 'voice');
    },
    
    // Get a single voice memo
    async getVoiceMemo(id) {
        return NotesDB.getNote(id);
    },
    
    // Create a voice memo
    async createVoiceMemo({ audioBlob, duration, date, transcription }) {
        const id = 'memo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const now = new Date().toISOString();
        
        await NotesDB.saveNote({
            id,
            type: 'voice',
            title: 'Voice Memo',
            content: '',
            audioBlob,
            audioDuration: duration,
            transcription: transcription || '',
            createdAt: now,
            updatedAt: now
        });
        
        return id;
    },
    
    // Update a voice memo
    async updateVoiceMemo(memo) {
        return NotesDB.updateNote(memo.id, {
            transcription: memo.transcription
        });
    },
    
    // Delete a voice memo
    async deleteVoiceMemo(id) {
        return NotesDB.deleteNote(id);
    },
    
    // Create a text note
    async createNote({ content, date }) {
        const id = 'note-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const now = new Date().toISOString();
        
        await NotesDB.saveNote({
            id,
            type: 'text',
            title: '',
            content,
            createdAt: now,
            updatedAt: now
        });
        
        return id;
    },
    
    // Update a note - supports both (id, updates) and (noteObject) signatures
    async updateNote(idOrNote, updates) {
        if (typeof idOrNote === 'object' && idOrNote !== null) {
            // Called with (noteObject) - extract id and use rest as updates
            const { id, ...rest } = idOrNote;
            return NotesDB.updateNote(id, rest);
        }
        return NotesDB.updateNote(idOrNote, updates);
    },
    
    // Delete a note
    async deleteNote(id) {
        return NotesDB.deleteNote(id);
    },
    
    // Get dates with notes - returns a Set for .has() compatibility
    async getDatesWithNotes(yearMonth) {
        const dates = await NotesDB.getDatesWithNotes();
        // Filter by yearMonth if provided (e.g. "2026-01")
        const filtered = yearMonth 
            ? dates.filter(d => d.startsWith(yearMonth))
            : dates;
        return new Set(filtered);
    }
};

// Make DB globally available
window.DB = DB;
