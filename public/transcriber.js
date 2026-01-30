/**
 * Voice Memo App - Transcriber Module
 * ====================================
 * Handles speech-to-text using Web Speech API
 */

const Transcriber = {
    recognition: null,
    isSupported: false,
    isListening: false,
    transcript: '',
    interimTranscript: '',
    
    // Callbacks
    onResult: null,
    onError: null,
    onEnd: null,
    
    /**
     * Initialize the transcriber
     */
    init() {
        // Check for browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (SpeechRecognition) {
            this.isSupported = true;
            this.recognition = new SpeechRecognition();
            
            // Configure recognition
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';
            this.recognition.maxAlternatives = 1;
            
            // Handle results
            this.recognition.onresult = (event) => {
                this.interimTranscript = '';
                let finalTranscript = '';
                
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[i];
                    const transcript = result[0].transcript;
                    
                    if (result.isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        this.interimTranscript += transcript;
                    }
                }
                
                if (finalTranscript) {
                    this.transcript += finalTranscript;
                }
                
                // Callback with both transcripts
                this.onResult?.(this.transcript, this.interimTranscript);
            };
            
            // Handle errors
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                
                let message = 'Speech recognition error';
                switch (event.error) {
                    case 'no-speech':
                        message = 'No speech detected';
                        break;
                    case 'audio-capture':
                        message = 'No microphone found';
                        break;
                    case 'not-allowed':
                        message = 'Microphone permission denied';
                        break;
                    case 'network':
                        message = 'Network error - transcription requires internet';
                        break;
                    case 'service-not-allowed':
                        message = 'Speech service not allowed - try Chrome instead of Chromium';
                        break;
                    case 'aborted':
                        message = 'Speech recognition aborted';
                        break;
                }
                
                // Update the live transcription UI with the error
                const liveEl = document.getElementById('live-transcription');
                if (liveEl) {
                    liveEl.innerHTML = `<span class="transcription-error" style="color: #f87171;">⚠️ ${message}</span>`;
                }
                
                this.onError?.(message);
            };
            
            // Handle end
            this.recognition.onend = () => {
                // Auto-restart if still supposed to be listening
                if (this.isListening) {
                    try {
                        this.recognition.start();
                    } catch (e) {
                        // Already started or stopped
                    }
                } else {
                    this.onEnd?.(this.transcript);
                }
            };
            
            console.log('📝 Speech recognition supported');
        } else {
            this.isSupported = false;
            console.warn('⚠️ Speech recognition not supported in this browser');
        }
    },
    
    /**
     * Start transcription
     */
    start() {
        if (!this.isSupported) {
            console.warn('Speech recognition not supported');
            return false;
        }
        
        this.transcript = '';
        this.interimTranscript = '';
        this.isListening = true;
        
        try {
            this.recognition.start();
            console.log('🎤 Transcription started');
            
            // Update UI to show we're actively listening
            const liveEl = document.getElementById('live-transcription');
            if (liveEl) {
                liveEl.innerHTML = '<span class="placeholder">🎤 Listening for speech...</span>';
            }
            
            return true;
        } catch (error) {
            console.error('Failed to start transcription:', error);
            this.isListening = false;
            
            // Show error in UI
            const liveEl = document.getElementById('live-transcription');
            if (liveEl) {
                liveEl.innerHTML = `<span class="transcription-error" style="color: #f87171;">⚠️ ${error.message}</span>`;
            }
            
            return false;
        }
    },
    
    /**
     * Stop transcription
     * @returns {string} Final transcript
     */
    stop() {
        this.isListening = false;
        
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (e) {
                // Already stopped
            }
        }
        
        console.log('⏹️ Transcription stopped');
        // Include interim results - they'd otherwise be lost if recording stops before finalization
        return (this.transcript + this.interimTranscript).trim();
    },
    
    /**
     * Get the current transcript
     */
    getTranscript() {
        return this.transcript.trim();
    },
    
    /**
     * Get the full transcript including interim results
     */
    getFullTranscript() {
        return (this.transcript + this.interimTranscript).trim();
    },
    
    /**
     * Clear the transcript
     */
    clear() {
        this.transcript = '';
        this.interimTranscript = '';
    }
};

// Make available globally
window.Transcriber = Transcriber;
