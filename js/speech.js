import { pipeline } from '@xenova/transformers';
import { config } from './config.js';

export class SpeechService {
    constructor() {
        this.transcriber = null;
        this.isModelLoading = false;
        this.isRecording = false;
        this.audioContext = null;
        this.mediaStream = null;
        this.processor = null;
        this.audioInput = null;
        this.audioData = [];
    }

    async init() {
        if (this.transcriber) return;

        this.isModelLoading = true;
        try {
            // Initialize Whisper pipeline
            // We use the 'automatic-speech-recognition' task
            this.transcriber = await pipeline('automatic-speech-recognition', config.whisperModel, {
                quantized: true, // Use quantized model for smaller size
                progress_callback: (data) => {
                    // Dispatch event for loading progress
                    const event = new CustomEvent('model-progress', {
                        detail: { model: 'whisper', ...data }
                    });
                    document.dispatchEvent(event);
                }
            });
            console.log("Whisper initialized");
        } catch (error) {
            console.error("Failed to initialize Whisper:", error);
            throw error;
        } finally {
            this.isModelLoading = false;
        }
    }

    async startRecording() {
        if (this.isRecording) return;

        try {
            // Check microphone permission first
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Microphone not supported in this browser');
            }

            this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
            this.audioInput = this.audioContext.createMediaStreamSource(this.mediaStream);
            this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

            this.audioData = [];

            this.processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                // Copy buffer to avoid reference issues
                this.audioData.push(new Float32Array(inputData));
            };

            this.audioInput.connect(this.processor);
            this.processor.connect(this.audioContext.destination);

            this.isRecording = true;
            console.log("Recording started");
        } catch (error) {
            console.error("Error starting recording:", error);
            if (error.name === 'NotAllowedError') {
                throw new Error('Microphone access denied. Please allow microphone permissions to use voice input.');
            } else if (error.name === 'NotFoundError') {
                throw new Error('No microphone found. Please connect a microphone to use voice input.');
            } else {
                throw new Error('Could not access microphone: ' + error.message);
            }
        }
    }

    async stopRecording() {
        if (!this.isRecording) return null;

        try {
            // Stop tracks
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.processor.disconnect();
            this.audioInput.disconnect();
            await this.audioContext.close();

            this.isRecording = false;
            console.log("Recording stopped");

            // Process audio data
            return await this.transcribe();
        } finally {
            // Always cleanup memory, even if transcription fails
            this.audioData = [];
            this.mediaStream = null;
            this.processor = null;
            this.audioInput = null;
            this.audioContext = null;
        }
    }

    async transcribe() {
        if (this.audioData.length === 0) return "";

        // Flatten audio data
        const totalLength = this.audioData.reduce((acc, val) => acc + val.length, 0);
        const audioBuffer = new Float32Array(totalLength);
        let offset = 0;
        for (const chunk of this.audioData) {
            audioBuffer.set(chunk, offset);
            offset += chunk.length;
        }

        // Run inference
        try {
            const output = await this.transcriber(audioBuffer, {
                language: 'spanish',
                task: 'transcribe'
            });

            // Output format depends on version, usually { text: "..." } or [{ text: "..." }]
            const text = Array.isArray(output) ? output[0].text : output.text;
            return text.trim();
        } catch (error) {
            console.error("Transcription error:", error);
            return "";
        }
    }

    speak(text, preferences = {}) {
        return new Promise((resolve, reject) => {
            if (!text) {
                resolve();
                return;
            }

            // Check if muted
            if (preferences.muted) {
                resolve();
                return;
            }

            // Cancel any current speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = config.ttsLang;
            utterance.rate = config.ttsRate;
            utterance.pitch = config.ttsPitch;

            // Try to find a good voice
            const voices = window.speechSynthesis.getVoices();
            const spanishVoices = voices.filter(v => v.lang.includes('es'));

            // Use selected voice if specified
            if (preferences.selectedVoice !== undefined && preferences.selectedVoice !== '') {
                const selectedIndex = parseInt(preferences.selectedVoice);
                if (spanishVoices[selectedIndex]) {
                    utterance.voice = spanishVoices[selectedIndex];
                }
            } else {
                // Prefer Google Español or Microsoft
                const preferredVoice = spanishVoices.find(v => v.name.includes('Google') || v.name.includes('Microsoft')) ||
                    spanishVoices[0];
                if (preferredVoice) {
                    utterance.voice = preferredVoice;
                }
            }

            utterance.onend = () => resolve();
            utterance.onerror = (e) => {
                if (e.error === 'interrupted') {
                    // This is expected when we cancel speech to start a new one
                    resolve();
                } else {
                    reject(e);
                }
            };

            window.speechSynthesis.speak(utterance);
        });
    }
}

// Singleton instance
let speechService = null;

export async function initSpeech() {
    if (!speechService) {
        speechService = new SpeechService();
        // We don't await init() here to avoid blocking UI, 
        // but we might want to trigger it if we want to preload
    }
    return speechService;
}

export function getSpeechService() {
    return speechService;
}
