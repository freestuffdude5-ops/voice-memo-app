/**
 * Voice Memo App - UI Module
 * ===========================
 * Handles UI helpers, animations, and interactions
 */

const UI = {
    toastContainer: null,
    editorOverlay: null,
    currentEditingNote: null,
    saveTimeout: null,
    
    /**
     * Initialize UI module
     */
    init() {
        this.toastContainer = document.getElementById('toast-container');
        this.createEditorOverlay();
        console.log('🎨 UI module ready');
    },
    
    /**
     * Show toast notification
     */
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        // Add icon based on type
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
        `;
        
        this.toastContainer?.appendChild(toast);
        
        // Auto-remove
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.25s ease forwards';
            setTimeout(() => toast.remove(), 250);
        }, duration);
    },
    
    /**
     * Create the note editor overlay
     */
    createEditorOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'note-editor-overlay';
        overlay.id = 'note-editor-overlay';
        
        overlay.innerHTML = `
            <div class="note-editor">
                <div class="note-editor-header">
                    <span class="note-editor-title">New Note</span>
                    <button class="note-editor-close" id="editor-close">✕</button>
                </div>
                <div class="note-editor-body">
                    <textarea 
                        class="note-textarea" 
                        id="note-textarea" 
                        placeholder="What's on your mind?"
                        autofocus
                    ></textarea>
                </div>
                <div class="note-editor-footer">
                    <span class="note-status" id="note-status">
                        <span class="status-dot"></span>
                        <span class="status-text">Ready</span>
                    </span>
                    <div class="note-actions">
                        <button class="btn btn-secondary" id="editor-delete" style="display: none;">
                            🗑️ Delete
                        </button>
                        <button class="btn btn-primary" id="editor-save">
                            💾 Save
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        this.editorOverlay = overlay;
        
        // Event listeners
        document.getElementById('editor-close')?.addEventListener('click', () => this.closeEditor());
        document.getElementById('editor-save')?.addEventListener('click', () => this.saveNote());
        document.getElementById('editor-delete')?.addEventListener('click', () => this.deleteCurrentNote());
        
        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.closeEditor();
        });
        
        // Auto-save on typing (debounced)
        document.getElementById('note-textarea')?.addEventListener('input', () => {
            this.debouncedSave();
        });
        
        // Escape to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.editorOverlay?.classList.contains('active')) {
                this.closeEditor();
            }
        });
    },
    
    /**
     * Show the note editor
     * @param {Object} note - Optional existing note to edit
     */
    async showNoteEditor(note = null) {
        const textarea = document.getElementById('note-textarea');
        const title = document.querySelector('.note-editor-title');
        const deleteBtn = document.getElementById('editor-delete');
        
        if (note) {
            // Editing existing note
            this.currentEditingNote = note;
            textarea.value = note.content;
            title.textContent = 'Edit Note';
            deleteBtn.style.display = 'inline-flex';
        } else {
            // New note
            this.currentEditingNote = null;
            textarea.value = '';
            title.textContent = 'New Note';
            deleteBtn.style.display = 'none';
        }
        
        this.updateStatus('Ready');
        this.editorOverlay?.classList.add('active');
        
        // Focus textarea after animation
        setTimeout(() => textarea?.focus(), 100);
    },
    
    /**
     * Close the note editor
     */
    closeEditor() {
        this.editorOverlay?.classList.remove('active');
        this.currentEditingNote = null;
        
        // Reload notes to show any changes
        if (typeof loadTodayData === 'function') {
            loadTodayData();
        } else if (window.App?.loadTodayData) {
            window.App.loadTodayData();
        }
    },
    
    /**
     * Debounced auto-save
     */
    debouncedSave() {
        this.updateStatus('Typing...', 'typing');
        
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            this.saveNote(true); // true = silent save
        }, 1000);
    },
    
    /**
     * Save the current note
     * @param {boolean} silent - If true, don't show toast
     */
    async saveNote(silent = false) {
        const textarea = document.getElementById('note-textarea');
        const content = textarea?.value.trim();
        
        if (!content) {
            if (!silent) this.showToast('Note is empty!', 'warning');
            return;
        }
        
        this.updateStatus('Saving...', 'saving');
        
        try {
            if (this.currentEditingNote) {
                // Update existing note
                await DB.updateNote(this.currentEditingNote.id, { content });
                this.currentEditingNote.content = content;
            } else {
                // Create new note
                const id = await DB.createNote({ 
                    content,
                    date: DB.getDateString(new Date())
                });
                // Fetch the created note so we can continue editing it
                this.currentEditingNote = await DB.getNote(id);
            }
            
            this.updateStatus('Saved', 'saved');
            
            if (!silent) {
                this.showToast('Note saved!', 'success');
                this.closeEditor();
            }
        } catch (error) {
            console.error('Failed to save note:', error);
            this.updateStatus('Error saving', 'error');
            this.showToast('Failed to save note', 'error');
        }
    },
    
    /**
     * Delete the current note
     */
    async deleteCurrentNote() {
        if (!this.currentEditingNote?.id) return;
        
        if (!confirm('Delete this note?')) return;
        
        try {
            await DB.deleteNote(this.currentEditingNote.id);
            this.showToast('Note deleted', 'info');
            this.closeEditor();
        } catch (error) {
            console.error('Failed to delete note:', error);
            this.showToast('Failed to delete note', 'error');
        }
    },
    
    /**
     * Update the status indicator
     */
    updateStatus(text, state = '') {
        const status = document.getElementById('note-status');
        if (!status) return;
        
        status.className = `note-status ${state}`;
        status.querySelector('.status-text').textContent = text;
    },
    
    /**
     * Render combined notes and voice memos
     * @param {Array} notes - Array of note objects
     * @param {Array} memos - Array of voice memo objects
     * @param {HTMLElement} container - Container element
     */
    renderContent(notes, memos, container) {
        if (!container) return;
        
        if (notes.length === 0 && memos.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">✨</div>
                    <h3>Start Your Day</h3>
                    <p>Record a voice memo or write your first note</p>
                </div>
            `;
            return;
        }
        
        // Combine and sort by createdAt (newest first)
        const items = [
            ...notes.map(n => ({ ...n, type: 'note' })),
            ...memos.map(m => ({ ...m, type: 'memo' }))
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        container.innerHTML = items.map(item => {
            if (item.type === 'note') {
                return this.renderNoteCard(item);
            } else {
                return this.renderVoiceMemoCard(item);
            }
        }).join('');
        
        // Setup note card handlers
        this.setupNoteCardHandlers(container);
        
        // Setup voice memo handlers
        this.setupVoiceMemoHandlers(container);
    },
    
    /**
     * Render a note card
     */
    renderNoteCard(note) {
        return `
            <div class="note-card" data-note-id="${note.id}">
                <div class="note-card-content">
                    ${this.escapeHtml(note.content).replace(/\n/g, '<br>')}
                </div>
                <div class="note-card-footer">
                    <span class="note-time">${this.formatTime(note.createdAt)}</span>
                    <div class="note-card-actions">
                        <button class="note-card-btn edit-btn" title="Edit">✏️</button>
                        <button class="note-card-btn delete-btn" title="Delete">🗑️</button>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Render a voice memo card with audio player
     */
    renderVoiceMemoCard(memo) {
        const duration = Recorder?.formatDuration?.(memo.audioDuration || memo.duration || 0) || '0:00';
        return `
            <div class="note-card voice-memo-card" data-memo-id="${memo.id}">
                <div class="voice-memo-header">
                    <span class="voice-memo-icon">🎤</span>
                    <span class="voice-memo-title">Voice Memo</span>
                    <span class="voice-memo-duration">${duration}</span>
                </div>
                <div class="voice-memo-player">
                    <button class="play-btn" data-memo-id="${memo.id}" title="Play">
                        <span class="play-icon">▶</span>
                    </button>
                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress-fill" data-progress-${memo.id}></div>
                        </div>
                        <span class="progress-time" data-time-${memo.id}>0:00 / ${duration}</span>
                    </div>
                </div>
                <div class="voice-memo-transcription" data-transcription-${memo.id}>
                    <div class="transcription-header">
                        <span class="transcription-label">Transcription:</span>
                        <button class="transcription-edit-btn" data-memo-id="${memo.id}" title="Edit transcription">✏️</button>
                    </div>
                    ${memo.transcription ? `
                        <p class="transcription-text">${this.escapeHtml(memo.transcription)}</p>
                    ` : `
                        <p class="transcription-text transcription-empty">No transcription available</p>
                    `}
                </div>
                <div class="note-card-footer">
                    <span class="note-time">${this.formatTime(memo.createdAt)}</span>
                    <div class="note-card-actions">
                        <button class="note-card-btn delete-btn" title="Delete">🗑️</button>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Setup note card event handlers
     */
    setupNoteCardHandlers(container) {
        container.querySelectorAll('.note-card:not(.voice-memo-card)').forEach(card => {
            const noteId = card.dataset.noteId;
            
            card.querySelector('.edit-btn')?.addEventListener('click', async (e) => {
                e.stopPropagation();
                const note = await DB.getNote(noteId);
                this.showNoteEditor(note);
            });
            
            card.querySelector('.delete-btn')?.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm('Delete this note?')) {
                    await DB.deleteNote(noteId);
                    this.showToast('Note deleted', 'info');
                    window.App?.loadTodayData();
                }
            });
            
            card.addEventListener('click', async () => {
                const note = await DB.getNote(noteId);
                this.showNoteEditor(note);
            });
        });
    },
    
    /**
     * Setup voice memo event handlers
     */
    setupVoiceMemoHandlers(container) {
        container.querySelectorAll('.voice-memo-card').forEach(card => {
            const memoId = card.dataset.memoId;
            
            // Play button
            const playBtn = card.querySelector('.play-btn');
            playBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMemoPlayback(memoId, playBtn);
            });
            
            // Edit transcription button
            const editBtn = card.querySelector('.transcription-edit-btn');
            editBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.editTranscription(memoId);
            });
            
            // Delete button
            card.querySelector('.delete-btn')?.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm('Delete this voice memo?')) {
                    // Stop playback if playing
                    this.stopAllPlayback();
                    await DB.deleteVoiceMemo(memoId);
                    this.showToast('Voice memo deleted', 'info');
                    window.App?.loadTodayData();
                }
            });
        });
    },
    
    /**
     * Edit transcription inline for a voice memo
     */
    async editTranscription(memoId) {
        const memo = await DB.getVoiceMemo(memoId);
        if (!memo) {
            this.showToast('Voice memo not found', 'error');
            return;
        }
        
        // Find the transcription container for this memo
        const card = document.querySelector(`[data-memo-id="${memoId}"]`);
        if (!card) return;
        
        const transcriptionDiv = card.querySelector('.voice-memo-transcription');
        if (!transcriptionDiv) return;
        
        // Replace with inline editor
        const currentText = memo.transcription || '';
        transcriptionDiv.innerHTML = `
            <div class="transcription-header">
                <span class="transcription-label">Edit Transcription:</span>
            </div>
            <textarea class="transcription-inline-editor" id="transcription-editor-${memoId}">${this.escapeHtml(currentText)}</textarea>
            <div class="transcription-actions">
                <button class="btn btn-secondary transcription-cancel-btn">Cancel</button>
                <button class="btn btn-primary transcription-save-btn">Save</button>
            </div>
        `;
        
        const textarea = document.getElementById(`transcription-editor-${memoId}`);
        textarea?.focus();
        
        // Save handler
        transcriptionDiv.querySelector('.transcription-save-btn')?.addEventListener('click', async () => {
            const newText = textarea.value.trim();
            try {
                memo.transcription = newText;
                await DB.updateVoiceMemo(memo);
                this.showToast('Transcription updated', 'success');
                window.App?.loadTodayData();
            } catch (error) {
                console.error('Failed to update transcription:', error);
                this.showToast('Failed to update transcription', 'error');
            }
        });
        
        // Cancel handler
        transcriptionDiv.querySelector('.transcription-cancel-btn')?.addEventListener('click', () => {
            window.App?.loadTodayData();
        });
        
        // Save on Ctrl+Enter
        textarea?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                transcriptionDiv.querySelector('.transcription-save-btn')?.click();
            }
        });
    },
    
    // Audio playback state
    currentAudio: null,
    currentMemoId: null,
    
    /**
     * Toggle voice memo playback
     */
    async toggleMemoPlayback(memoId, playBtn) {
        // If same memo is playing, pause it
        if (this.currentMemoId === memoId && this.currentAudio) {
            if (this.currentAudio.paused) {
                this.currentAudio.play();
                playBtn.querySelector('.play-icon').textContent = '⏸';
            } else {
                this.currentAudio.pause();
                playBtn.querySelector('.play-icon').textContent = '▶';
            }
            return;
        }
        
        // Stop any current playback
        this.stopAllPlayback();
        
        try {
            // Get memo from DB
            const memo = await DB.getVoiceMemo(memoId);
            if (!memo?.audioBlob) {
                this.showToast('Audio not found', 'error');
                return;
            }
            
            // Create audio URL and element
            const audioUrl = URL.createObjectURL(memo.audioBlob);
            this.currentAudio = new Audio(audioUrl);
            this.currentMemoId = memoId;
            
            // Update UI
            playBtn.querySelector('.play-icon').textContent = '⏸';
            
            // Progress updates
            this.currentAudio.addEventListener('timeupdate', () => {
                const progress = (this.currentAudio.currentTime / this.currentAudio.duration) * 100;
                const progressFill = document.querySelector(`[data-progress-${memoId}]`);
                const timeDisplay = document.querySelector(`[data-time-${memoId}]`);
                
                if (progressFill) {
                    progressFill.style.width = `${progress}%`;
                }
                if (timeDisplay) {
                    const current = Recorder?.formatDuration?.(Math.floor(this.currentAudio.currentTime)) || '0:00';
                    const total = Recorder?.formatDuration?.(Math.floor(this.currentAudio.duration)) || '0:00';
                    timeDisplay.textContent = `${current} / ${total}`;
                }
            });
            
            // Seekable progress bar
            const progressBar = document.querySelector(`[data-progress-${memoId}]`)?.parentElement;
            if (progressBar) {
                progressBar.addEventListener('click', (e) => {
                    if (!this.currentAudio || this.currentMemoId !== memoId) return;
                    const rect = progressBar.getBoundingClientRect();
                    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    this.currentAudio.currentTime = ratio * this.currentAudio.duration;
                });
            }
            
            // End of playback
            this.currentAudio.addEventListener('ended', () => {
                playBtn.querySelector('.play-icon').textContent = '▶';
                const progressFill = document.querySelector(`[data-progress-${memoId}]`);
                if (progressFill) progressFill.style.width = '0%';
                this.currentAudio = null;
                this.currentMemoId = null;
                URL.revokeObjectURL(audioUrl);
            });
            
            // Start playback
            await this.currentAudio.play();
            
        } catch (error) {
            console.error('Playback error:', error);
            this.showToast('Failed to play audio', 'error');
        }
    },
    
    /**
     * Stop all audio playback
     */
    stopAllPlayback() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
        
        // Reset all play buttons
        document.querySelectorAll('.play-btn .play-icon').forEach(icon => {
            icon.textContent = '▶';
        });
        
        // Reset all progress bars
        document.querySelectorAll('[class^="data-progress-"]').forEach(bar => {
            bar.style.width = '0%';
        });
        
        this.currentMemoId = null;
    },
    
    /**
     * Render notes list in the container (legacy - now uses renderContent)
     * @param {Array} notes - Array of note objects
     * @param {HTMLElement} container - Container element
     */
    renderNotesList(notes, container) {
        if (!container) return;
        
        if (notes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">✨</div>
                    <h3>Start Your Day</h3>
                    <p>Record a voice memo or write your first note</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = notes.map(note => `
            <div class="note-card" data-note-id="${note.id}">
                <div class="note-card-content">
                    ${this.escapeHtml(note.content).replace(/\n/g, '<br>')}
                </div>
                <div class="note-card-footer">
                    <span class="note-time">${this.formatTime(note.createdAt)}</span>
                    <div class="note-card-actions">
                        <button class="note-card-btn edit-btn" title="Edit">✏️</button>
                        <button class="note-card-btn delete-btn" title="Delete">🗑️</button>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add click handlers
        container.querySelectorAll('.note-card').forEach(card => {
            const noteId = card.dataset.noteId;
            
            // Edit on card click
            card.querySelector('.edit-btn')?.addEventListener('click', async (e) => {
                e.stopPropagation();
                const note = await DB.getNote(noteId);
                this.showNoteEditor(note);
            });
            
            // Delete button
            card.querySelector('.delete-btn')?.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm('Delete this note?')) {
                    await DB.deleteNote(noteId);
                    this.showToast('Note deleted', 'info');
                    window.App?.loadTodayData();
                }
            });
            
            // Click card to edit
            card.addEventListener('click', async () => {
                const note = await DB.getNote(noteId);
                this.showNoteEditor(note);
            });
        });
    },
    
    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    /**
     * Format timestamp to readable time
     */
    formatTime(isoString) {
        const date = new Date(isoString);
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    },
    
    /**
     * Show loading state
     */
    showLoading(container) {
        if (!container) return;
        container.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Loading...</p>
            </div>
        `;
    },
    
    /**
     * Hide loading state
     */
    hideLoading() {
        // Loading is replaced by content rendering
    }
};

// Make available globally
window.UI = UI;
