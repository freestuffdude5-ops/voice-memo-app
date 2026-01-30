/**
 * Voice Memo App - Recorder Module
 * =================================
 * Handles voice recording using MediaRecorder API
 */

const Recorder = {
    mediaRecorder: null,
    audioChunks: [],
    stream: null,
    isRecording: false,
    startTime: null,
    timerInterval: null,
    analyser: null,
    audioContext: null,
    animationFrame: null,
    
    // Callbacks
    onStop: null,
    onError: null,
    onTimer: null,
    
    /**
     * Initialize the recorder
     */
    async init() {
        // Check for MediaRecorder support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.warn('⚠️ MediaRecorder not supported');
            return false;
        }
        console.log('🎤 Recorder module ready');
        return true;
    },
    
    /**
     * Request microphone permission
     */
    async requestPermission() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            console.log('✅ Microphone permission granted');
            return true;
        } catch (error) {
            console.error('❌ Microphone permission denied:', error);
            
            if (error.name === 'NotAllowedError') {
                this.onError?.('Microphone permission denied. Please allow access in your browser settings.');
            } else if (error.name === 'NotFoundError') {
                this.onError?.('No microphone found. Please connect a microphone and try again.');
            } else {
                this.onError?.('Could not access microphone: ' + error.message);
            }
            
            return false;
        }
    },
    
    /**
     * Start recording
     */
    async start() {
        // Request permission if we don't have a stream
        if (!this.stream) {
            const granted = await this.requestPermission();
            if (!granted) return false;
        }
        
        try {
            this.audioChunks = [];
            
            // Create MediaRecorder with supported MIME type
            const mimeType = this.getSupportedMimeType();
            this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });
            
            // Handle data available
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            // Handle recording stop
            this.mediaRecorder.onstop = async () => {
                this.isRecording = false;
                this.stopTimer();
                
                // Create blob from chunks
                const audioBlob = new Blob(this.audioChunks, { type: mimeType });
                const duration = this.getRecordingDuration();
                
                console.log(`🎤 Recording complete: ${(audioBlob.size / 1024).toFixed(1)}KB, ${duration}s`);
                
                // Callback with the recording
                this.onStop?.(audioBlob, duration);
            };
            
            // Handle errors
            this.mediaRecorder.onerror = (event) => {
                console.error('❌ Recording error:', event.error);
                this.isRecording = false;
                this.stopTimer();
                this.onError?.('Recording failed: ' + event.error.message);
            };
            
            // Setup audio analyser for waveform visualization
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const source = this.audioContext.createMediaStreamSource(this.stream);
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = 256;
                source.connect(this.analyser);
                this.startWaveformAnimation();
            } catch (e) {
                console.warn('Could not setup audio analyser:', e);
            }
            
            // Start recording
            this.mediaRecorder.start(1000); // Collect data every second
            this.isRecording = true;
            this.startTime = Date.now();
            this.startTimer();
            
            console.log('🎤 Recording started');
            return true;
            
        } catch (error) {
            console.error('❌ Failed to start recording:', error);
            this.onError?.('Failed to start recording: ' + error.message);
            return false;
        }
    },
    
    /**
     * Stop recording
     */
    stop() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.stopWaveformAnimation();
            console.log('⏹️ Recording stopped');
        }
    },
    
    /**
     * Cancel recording without saving
     */
    cancel() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.audioChunks = [];
            this.isRecording = false;
            this.stopTimer();
            this.stopWaveformAnimation();
            console.log('❌ Recording cancelled');
        }
    },
    
    /**
     * Get recording duration in seconds
     */
    getRecordingDuration() {
        if (!this.startTime) return 0;
        return Math.floor((Date.now() - this.startTime) / 1000);
    },
    
    /**
     * Start the duration timer
     */
    startTimer() {
        this.timerInterval = setInterval(() => {
            const duration = this.getRecordingDuration();
            this.onTimer?.(duration);
        }, 100);
    },
    
    /**
     * Stop the duration timer
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    },
    
    /**
     * Format seconds to MM:SS
     */
    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    
    /**
     * Get supported MIME type
     */
    getSupportedMimeType() {
        const types = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
            'audio/mp4',
            'audio/mpeg'
        ];
        
        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                console.log('📼 Using MIME type:', type);
                return type;
            }
        }
        
        console.warn('⚠️ No preferred MIME type supported, using default');
        return '';
    },
    
    /**
     * Start waveform animation using analyser data
     */
    startWaveformAnimation() {
        if (!this.analyser) return;
        
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        const bars = document.querySelectorAll('#waveform-live .bar');
        
        const animate = () => {
            if (!this.isRecording) return;
            
            this.analyser.getByteFrequencyData(dataArray);
            
            // Map frequency data to bars
            const barCount = bars.length;
            const step = Math.floor(dataArray.length / barCount);
            
            bars.forEach((bar, i) => {
                const value = dataArray[i * step] || 0;
                const height = Math.max(4, (value / 255) * 40);
                bar.style.height = `${height}px`;
                bar.style.opacity = Math.max(0.4, value / 255);
                bar.style.animation = 'none'; // Override CSS animation with real data
            });
            
            this.animationFrame = requestAnimationFrame(animate);
        };
        
        animate();
    },
    
    /**
     * Stop waveform animation
     */
    stopWaveformAnimation() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        if (this.audioContext) {
            this.audioContext.close().catch(() => {});
            this.audioContext = null;
        }
        this.analyser = null;
    },
    
    /**
     * Clean up resources
     */
    cleanup() {
        this.stopTimer();
        this.stopWaveformAnimation();
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
    }
};

// Make available globally
window.Recorder = Recorder;
