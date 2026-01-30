/**
 * Voice Memo App - Main Application
 * =================================
 * Entry point and coordinator for all app modules
 */

// App State
const AppState = {
    currentView: 'today',
    selectedDate: new Date(),
    isRecording: false,
    notes: [],
    voiceMemos: []
};

// DOM Elements cache
const DOM = {
    app: null,
    currentDate: null,
    currentTime: null,
    navItems: null,
    views: null,
    btnNewNote: null,
    btnRecord: null,
    notesContainer: null,
    toastContainer: null,
    sidebar: null,
    sidebarOverlay: null,
    mobileMenuBtn: null
};

/**
 * Initialize the application
 */
async function initApp() {
    console.log('🎙️ Voice Memo App initializing...');
    
    // Cache DOM elements
    cacheDOMElements();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize modules
    await initializeModules();
    
    // Update UI
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Load initial data
    await loadTodayData();
    
    console.log('✅ Voice Memo App ready!');
}

/**
 * Cache frequently used DOM elements
 */
function cacheDOMElements() {
    DOM.app = document.getElementById('app');
    DOM.currentDate = document.getElementById('current-date');
    DOM.currentTime = document.getElementById('current-time');
    DOM.navItems = document.querySelectorAll('.nav-item');
    DOM.views = document.querySelectorAll('.view');
    DOM.btnNewNote = document.getElementById('btn-new-note');
    DOM.btnRecord = document.getElementById('btn-record');
    DOM.notesContainer = document.querySelector('.notes-container');
    DOM.toastContainer = document.getElementById('toast-container');
    DOM.sidebar = document.getElementById('sidebar');
    DOM.sidebarOverlay = document.getElementById('sidebar-overlay');
    DOM.mobileMenuBtn = document.getElementById('mobile-menu-btn');
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Navigation
    DOM.navItems.forEach(item => {
        item.addEventListener('click', () => {
            const view = item.dataset.view;
            switchView(view);
            closeMobileMenu(); // Close menu on navigation (mobile)
        });
    });
    
    // New Note button
    DOM.btnNewNote?.addEventListener('click', createNewNote);
    
    // Record button
    DOM.btnRecord?.addEventListener('click', toggleRecording);
    
    // Mobile menu
    DOM.mobileMenuBtn?.addEventListener('click', toggleMobileMenu);
    DOM.sidebarOverlay?.addEventListener('click', closeMobileMenu);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

/**
 * Toggle mobile menu
 */
function toggleMobileMenu() {
    DOM.sidebar?.classList.toggle('open');
    DOM.sidebarOverlay?.classList.toggle('active');
}

/**
 * Close mobile menu
 */
function closeMobileMenu() {
    DOM.sidebar?.classList.remove('open');
    DOM.sidebarOverlay?.classList.remove('active');
}

/**
 * Initialize all modules
 */
async function initializeModules() {
    // Initialize database
    if (typeof DB !== 'undefined') {
        await DB.init();
        console.log('📦 Database initialized');
    }
    
    // Initialize recorder
    if (typeof Recorder !== 'undefined') {
        await Recorder.init();
        console.log('🎤 Recorder initialized');
    }
    
    // Initialize transcriber
    if (typeof Transcriber !== 'undefined') {
        Transcriber.init();
        console.log('📝 Transcriber initialized');
    }
    
    // Initialize UI helpers
    if (typeof UI !== 'undefined') {
        UI.init();
        console.log('🎨 UI initialized');
    }
}

/**
 * Switch between views
 */
function switchView(viewName) {
    AppState.currentView = viewName;
    
    // Update nav items
    DOM.navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.view === viewName);
    });
    
    // Update views
    DOM.views.forEach(view => {
        view.classList.toggle('active', view.id === `view-${viewName}`);
    });
    
    // Initialize calendar when switching to calendar view
    if (viewName === 'calendar' && typeof Calendar !== 'undefined') {
        Calendar.init();
    }
    
    // Load recordings when switching to recordings view
    if (viewName === 'recordings') {
        loadRecordingsView();
    }
}

/**
 * Load and render the recordings view
 */
async function loadRecordingsView() {
    console.log('🎤 Loading recordings view...');
    
    const listContainer = document.getElementById('recordings-list');
    const statsContainer = document.getElementById('recordings-stats');
    const searchInput = document.getElementById('recordings-search');
    
    if (!listContainer) return;
    
    try {
        // Load all notes and filter for voice memos (notes with audioData)
        const allNotes = await NotesDB.getAllNotes();
        const recordings = allNotes.filter(note => note.audioData || note.type === 'voice');
        
        // Sort by date (newest first)
        recordings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Store for search filtering
        AppState.allRecordings = recordings;
        
        // Render stats
        renderRecordingsStats(recordings, statsContainer);
        
        // Render recordings list
        renderRecordingsList(recordings, listContainer);
        
        // Setup search
        if (searchInput) {
            searchInput.value = '';
            searchInput.oninput = (e) => {
                const query = e.target.value.toLowerCase();
                const filtered = recordings.filter(r => 
                    (r.transcription && r.transcription.toLowerCase().includes(query)) ||
                    (r.title && r.title.toLowerCase().includes(query)) ||
                    (r.content && r.content.toLowerCase().includes(query))
                );
                renderRecordingsList(filtered, listContainer);
            };
        }
        
        console.log(`🎤 Loaded ${recordings.length} recordings`);
    } catch (error) {
        console.error('Failed to load recordings:', error);
        listContainer.innerHTML = '<div class="recordings-empty"><p>Failed to load recordings</p></div>';
    }
}

/**
 * Render recordings statistics
 */
function renderRecordingsStats(recordings, container) {
    if (!container) return;
    
    const totalDuration = recordings.reduce((sum, r) => sum + (r.audioDuration || 0), 0);
    const totalMinutes = Math.floor(totalDuration / 60);
    const withTranscription = recordings.filter(r => r.transcription && r.transcription.trim()).length;
    
    container.innerHTML = `
        <div class="stat-card">
            <span class="stat-icon">🎙️</span>
            <div class="stat-info">
                <span class="stat-value">${recordings.length}</span>
                <span class="stat-label">Total Recordings</span>
            </div>
        </div>
        <div class="stat-card">
            <span class="stat-icon">⏱️</span>
            <div class="stat-info">
                <span class="stat-value">${totalMinutes}m</span>
                <span class="stat-label">Total Duration</span>
            </div>
        </div>
        <div class="stat-card">
            <span class="stat-icon">📝</span>
            <div class="stat-info">
                <span class="stat-value">${withTranscription}</span>
                <span class="stat-label">Transcribed</span>
            </div>
        </div>
    `;
}

/**
 * Render recordings list
 */
function renderRecordingsList(recordings, container) {
    if (!container) return;
    
    if (recordings.length === 0) {
        container.innerHTML = `
            <div class="recordings-empty">
                <div class="recordings-empty-icon">🎤</div>
                <div class="recordings-empty-text">No recordings yet</div>
                <div class="recordings-empty-hint">Press the microphone button or hit Space to record</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recordings.map(recording => {
        const date = new Date(recording.createdAt);
        const dateStr = date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
        const timeStr = date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        const duration = formatDuration(recording.audioDuration || 0);
        
        return `
            <div class="recording-card" data-recording-id="${recording.id}">
                <div class="recording-card-header">
                    <div class="recording-meta">
                        <span class="recording-date">${dateStr}</span>
                        <span class="recording-time">${timeStr}</span>
                    </div>
                    <span class="recording-duration">${duration}</span>
                </div>
                <div class="recording-player">
                    <button class="recording-play-btn" data-action="play">▶</button>
                    <div class="recording-waveform"></div>
                </div>
                ${recording.transcription ? `
                    <div class="recording-transcription">${recording.transcription}</div>
                ` : ''}
                <div class="recording-actions">
                    <button class="recording-action-btn delete" data-action="delete">🗑️ Delete</button>
                </div>
            </div>
        `;
    }).join('');
    
    // Setup event handlers
    setupRecordingCardHandlers(container);
}

/**
 * Format duration in seconds to mm:ss
 */
function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Setup event handlers for recording cards
 */
function setupRecordingCardHandlers(container) {
    let currentAudio = null;
    let currentButton = null;
    
    container.querySelectorAll('.recording-card').forEach(card => {
        const recordingId = card.dataset.recordingId;
        const playBtn = card.querySelector('[data-action="play"]');
        const deleteBtn = card.querySelector('[data-action="delete"]');
        
        // Play button
        playBtn?.addEventListener('click', async () => {
            // Stop current audio if playing
            if (currentAudio) {
                currentAudio.pause();
                currentAudio = null;
                if (currentButton) currentButton.textContent = '▶';
            }
            
            // If clicking same button, just stop
            if (currentButton === playBtn && playBtn.textContent === '⏸') {
                playBtn.textContent = '▶';
                currentButton = null;
                return;
            }
            
            // Find recording and play
            const recording = AppState.allRecordings?.find(r => r.id === recordingId);
            if (recording && recording.audioBlob) {
                const url = URL.createObjectURL(recording.audioBlob);
                currentAudio = new Audio(url);
                currentButton = playBtn;
                playBtn.textContent = '⏸';
                
                currentAudio.onended = () => {
                    playBtn.textContent = '▶';
                    currentButton = null;
                    URL.revokeObjectURL(url);
                };
                
                currentAudio.play();
            }
        });
        
        // Delete button
        deleteBtn?.addEventListener('click', async () => {
            if (confirm('Delete this recording?')) {
                try {
                    await NotesDB.deleteNote(recordingId);
                    card.remove();
                    
                    // Update stats
                    AppState.allRecordings = AppState.allRecordings?.filter(r => r.id !== recordingId);
                    const statsContainer = document.getElementById('recordings-stats');
                    if (AppState.allRecordings) {
                        renderRecordingsStats(AppState.allRecordings, statsContainer);
                    }
                    
                    showToast('Recording deleted', 'success');
                } catch (error) {
                    console.error('Failed to delete recording:', error);
                    showToast('Failed to delete recording', 'error');
                }
            }
        });
    });
}

/**
 * Update date and time display
 */
function updateDateTime() {
    const now = new Date();
    
    const dateOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    
    const timeOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    
    if (DOM.currentDate) {
        DOM.currentDate.textContent = now.toLocaleDateString('en-US', dateOptions);
    }
    
    if (DOM.currentTime) {
        DOM.currentTime.textContent = now.toLocaleTimeString('en-US', timeOptions);
    }
}

/**
 * Load today's data
 */
async function loadTodayData() {
    console.log('📅 Loading today\'s data...');
    
    const today = DB.getDateString(new Date());
    AppState.selectedDate = new Date();
    
    try {
        // Load notes for today
        const notes = await DB.getAllNotes(today);
        AppState.notes = notes;
        
        // Load voice memos for today
        const memos = await DB.getAllVoiceMemos(today);
        AppState.voiceMemos = memos;
        
        // Render combined content
        if (typeof UI !== 'undefined' && UI.renderContent) {
            UI.renderContent(notes, memos, DOM.notesContainer);
        } else if (typeof UI !== 'undefined' && UI.renderNotesList) {
            UI.renderNotesList(notes, DOM.notesContainer);
        }
        
        console.log(`📝 Loaded ${notes.length} notes, ${memos.length} voice memos for today`);
    } catch (error) {
        console.error('Failed to load today\'s data:', error);
        showToast('Failed to load notes', 'error');
    }
}

/**
 * Create a new note
 */
function createNewNote() {
    console.log('📝 Opening note editor...');
    if (typeof UI !== 'undefined' && UI.showNoteEditor) {
        UI.showNoteEditor(null); // null = new note
    } else {
        showToast('Note editor not available', 'error');
    }
}

/**
 * Toggle voice recording
 */
async function toggleRecording() {
    if (AppState.isRecording) {
        await stopRecording();
    } else {
        await startRecording();
    }
}

/**
 * Start voice recording
 */
async function startRecording() {
    console.log('🎤 Starting recording...');
    
    // Setup recorder callbacks
    Recorder.onTimer = (duration) => {
        updateRecordingUI(duration);
    };
    
    Recorder.onStop = async (audioBlob, duration) => {
        AppState.isRecording = false;
        DOM.btnRecord?.classList.remove('recording');
        hideRecordingTimer();
        playSound('stop'); // Sound feedback
        
        // Stop transcription and get final text
        const transcription = Transcriber.isSupported ? Transcriber.stop() : '';
        
        // Save to database
        try {
            const today = DB.getDateString(new Date());
            const id = await DB.createVoiceMemo({
                audioBlob,
                duration,
                date: today,
                transcription
            });
            
            showToast(`Recording saved! (${Recorder.formatDuration(duration)})`, 'success');
            
            // Reload today's data to show the new memo
            await loadTodayData();
            
        } catch (error) {
            console.error('Failed to save recording:', error);
            showToast('Failed to save recording', 'error');
        }
    };
    
    Recorder.onError = (message) => {
        AppState.isRecording = false;
        DOM.btnRecord?.classList.remove('recording');
        hideRecordingTimer();
        Transcriber.stop();
        showToast(message, 'error');
    };
    
    // Start recording
    const started = await Recorder.start();
    
    if (started) {
        AppState.isRecording = true;
        DOM.btnRecord?.classList.add('recording');
        showRecordingTimer();
        playSound('start'); // Sound feedback
        
        // Start transcription
        if (Transcriber.isSupported) {
            Transcriber.onResult = (transcript, interim) => {
                updateTranscriptionUI(transcript, interim);
            };
            Transcriber.start();
        }
        
        showToast('Recording...', 'info');
    }
}

/**
 * Stop voice recording
 */
async function stopRecording() {
    console.log('⏹️ Stopping recording...');
    Recorder.stop();
}

/**
 * Show recording timer overlay
 */
function showRecordingTimer() {
    // Create timer element if it doesn't exist
    let timer = document.getElementById('recording-timer');
    if (!timer) {
        timer = document.createElement('div');
        timer.id = 'recording-timer';
        timer.className = 'recording-timer';
        timer.innerHTML = `
            <div class="recording-timer-content">
                <div class="recording-indicator">
                    <span class="recording-dot"></span>
                    <span class="recording-label">Recording</span>
                </div>
                <div class="recording-waveform-live" id="waveform-live">
                    <div class="bar"></div><div class="bar"></div><div class="bar"></div>
                    <div class="bar"></div><div class="bar"></div><div class="bar"></div>
                    <div class="bar"></div><div class="bar"></div><div class="bar"></div>
                    <div class="bar"></div>
                </div>
                <div class="recording-duration">00:00</div>
                ${Transcriber.isSupported ? `
                <div class="live-transcription-container">
                    <div id="live-transcription" class="live-transcription">
                        <span class="placeholder">Listening...</span>
                    </div>
                </div>
                ` : ''}
                <button class="btn btn-primary recording-stop" onclick="stopRecording()">✓ Stop & Save</button>
                <button class="btn btn-secondary recording-cancel" onclick="cancelRecording()">Cancel</button>
            </div>
        `;
        document.body.appendChild(timer);
    }
    
    // Reset transcription display
    const transcriptEl = document.getElementById('live-transcription');
    if (transcriptEl) {
        transcriptEl.innerHTML = '<span class="placeholder">Listening...</span>';
    }
    
    timer.classList.add('active');
}

/**
 * Hide recording timer
 */
function hideRecordingTimer() {
    const timer = document.getElementById('recording-timer');
    timer?.classList.remove('active');
}

/**
 * Update recording UI with current duration
 */
function updateRecordingUI(duration) {
    const timerEl = document.querySelector('.recording-duration');
    if (timerEl) {
        timerEl.textContent = Recorder.formatDuration(duration);
    }
}

/**
 * Cancel recording
 */
function cancelRecording() {
    Recorder.cancel();
    Transcriber.stop();
    AppState.isRecording = false;
    DOM.btnRecord?.classList.remove('recording');
    hideRecordingTimer();
    showToast('Recording cancelled', 'info');
}

/**
 * Update transcription UI during recording
 */
function updateTranscriptionUI(transcript, interim) {
    const transcriptEl = document.getElementById('live-transcription');
    if (transcriptEl) {
        const combined = transcript + (interim ? `<span class="interim">${interim}</span>` : '');
        transcriptEl.innerHTML = combined || '<span class="placeholder">Listening...</span>';
    }
}

/**
 * Handle keyboard shortcuts
 */
function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + N: New note
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        createNewNote();
    }
    
    // Ctrl/Cmd + R: Toggle recording (when not in input)
    if ((e.ctrlKey || e.metaKey) && e.key === 'r' && 
        !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        toggleRecording();
    }
    
    // Space: Toggle recording (when not in input)
    if (e.key === ' ' && 
        !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) &&
        !document.querySelector('.note-editor-overlay.active')) {
        e.preventDefault();
        toggleRecording();
    }
    
    // Escape: Stop recording or close editor
    if (e.key === 'Escape') {
        if (AppState.isRecording) {
            cancelRecording();
        }
    }
    
    // Number keys 1-3 for navigation
    if (!e.ctrlKey && !e.metaKey && !e.altKey &&
        !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        if (e.key === '1') switchView('today');
        if (e.key === '2') switchView('calendar');
        if (e.key === '3') switchView('recordings');
        
        // ? key for shortcuts modal
        if (e.key === '?') {
            const overlay = document.getElementById('shortcuts-overlay');
            overlay?.classList.toggle('active');
        }
    }
}

/**
 * Play a subtle sound effect
 */
function playSound(type) {
    // Create oscillator for simple beep sounds
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        if (type === 'start') {
            oscillator.frequency.value = 880; // A5
            gainNode.gain.value = 0.1;
        } else if (type === 'stop') {
            oscillator.frequency.value = 440; // A4
            gainNode.gain.value = 0.1;
        } else {
            oscillator.frequency.value = 660; // E5
            gainNode.gain.value = 0.08;
        }
        
        oscillator.type = 'sine';
        oscillator.start();
        
        // Fade out
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);
        oscillator.stop(audioContext.currentTime + 0.15);
    } catch (e) {
        // Audio not available, skip sound
    }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    if (typeof UI !== 'undefined' && UI.showToast) {
        UI.showToast(message, type);
    } else {
        // Fallback toast implementation
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        DOM.toastContainer?.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.25s ease forwards';
            setTimeout(() => toast.remove(), 250);
        }, 3000);
    }
}

// ==========================================
// CALENDAR FUNCTIONALITY
// ==========================================

const Calendar = {
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    selectedDate: null,
    datesWithNotes: new Set(),
    
    async init() {
        this.bindEvents();
        await this.render();
    },
    
    bindEvents() {
        document.getElementById('prev-month')?.addEventListener('click', () => this.prevMonth());
        document.getElementById('next-month')?.addEventListener('click', () => this.nextMonth());
        document.getElementById('today-btn')?.addEventListener('click', () => this.goToToday());
    },
    
    async render() {
        const grid = document.getElementById('calendar-grid');
        const monthYear = document.getElementById('calendar-month-year');
        
        if (!grid || !monthYear) return;
        
        // Update header
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
        monthYear.textContent = `${monthNames[this.currentMonth]} ${this.currentYear}`;
        
        // Get dates with notes for this month
        const yearMonth = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}`;
        this.datesWithNotes = await DB.getDatesWithNotes(yearMonth);
        
        // Generate calendar grid
        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
        const startingDay = firstDay.getDay();
        const totalDays = lastDay.getDate();
        
        const today = new Date();
        const todayStr = DB.getDateString(today);
        
        let html = '';
        
        // Empty cells before first day
        for (let i = 0; i < startingDay; i++) {
            html += '<button class="calendar-day empty"></button>';
        }
        
        // Days of the month
        for (let day = 1; day <= totalDays; day++) {
            const dateStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === this.selectedDate;
            const hasNotes = this.datesWithNotes.has(dateStr);
            
            const classes = ['calendar-day'];
            if (isToday) classes.push('today');
            if (isSelected) classes.push('selected');
            if (hasNotes) classes.push('has-notes');
            
            html += `<button class="${classes.join(' ')}" data-date="${dateStr}">${day}</button>`;
        }
        
        grid.innerHTML = html;
        
        // Add click handlers
        grid.querySelectorAll('.calendar-day:not(.empty)').forEach(btn => {
            btn.addEventListener('click', () => this.selectDate(btn.dataset.date));
        });
    },
    
    async selectDate(dateStr) {
        this.selectedDate = dateStr;
        await this.render(); // Re-render to show selection
        await this.loadDatePreview(dateStr);
    },
    
    async loadDatePreview(dateStr) {
        const previewDate = document.getElementById('preview-date');
        const previewContent = document.getElementById('preview-content');
        
        if (!previewDate || !previewContent) return;
        
        // Format the date nicely
        const date = new Date(dateStr + 'T00:00:00');
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        previewDate.textContent = date.toLocaleDateString('en-US', options);
        
        // Load notes and memos for this date
        const notes = await DB.getAllNotes(dateStr);
        const memos = await DB.getAllVoiceMemos(dateStr);
        
        if (notes.length === 0 && memos.length === 0) {
            previewContent.innerHTML = '<p class="preview-empty">No notes for this date</p>';
            return;
        }
        
        // Combine and sort
        const items = [
            ...notes.map(n => ({ ...n, type: 'note' })),
            ...memos.map(m => ({ ...m, type: 'memo' }))
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        previewContent.innerHTML = items.map(item => {
            const time = new Date(item.createdAt).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit'
            });
            
            if (item.type === 'note') {
                return `
                    <div class="preview-item">
                        <div class="preview-item-type">📝 Note</div>
                        <div class="preview-item-content">${UI.escapeHtml(item.content)}</div>
                        <div class="preview-item-time">${time}</div>
                    </div>
                `;
            } else {
                const duration = Recorder?.formatDuration?.(item.audioDuration || item.duration || 0) || '0:00';
                return `
                    <div class="preview-item voice-memo">
                        <div class="preview-item-type">🎤 Voice Memo (${duration})</div>
                        <div class="preview-item-content">${item.transcription ? UI.escapeHtml(item.transcription) : '<em>No transcription</em>'}</div>
                        <div class="preview-item-time">${time}</div>
                    </div>
                `;
            }
        }).join('');
    },
    
    prevMonth() {
        this.currentMonth--;
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        this.render();
    },
    
    nextMonth() {
        this.currentMonth++;
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        this.render();
    },
    
    goToToday() {
        const today = new Date();
        this.currentMonth = today.getMonth();
        this.currentYear = today.getFullYear();
        this.selectDate(DB.getDateString(today));
    }
};

// Offline detection
window.addEventListener('online', () => {
    document.getElementById('offline-banner')?.classList.remove('visible');
    showToast('Back online!', 'success');
});

window.addEventListener('offline', () => {
    document.getElementById('offline-banner')?.classList.add('visible');
});

// Close shortcuts modal on click outside or Escape
document.addEventListener('click', (e) => {
    const overlay = document.getElementById('shortcuts-overlay');
    if (e.target === overlay) overlay?.classList.remove('active');
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.getElementById('shortcuts-overlay')?.classList.remove('active');
    }
});

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    // Check initial online state
    if (!navigator.onLine) {
        document.getElementById('offline-banner')?.classList.add('visible');
    }
});

// Export for modules
window.App = {
    state: AppState,
    showToast,
    switchView,
    loadTodayData
};

window.Calendar = Calendar;
