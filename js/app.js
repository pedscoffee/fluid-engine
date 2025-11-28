import { initUI } from './ui.js';
import { initConversation } from './conversation.js';
import { initSpeech } from './speech.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('App initializing...');
    
    // Initialize UI handlers
    initUI();
    
    // Initialize Speech (Whisper + TTS)
    // We do this early to request permissions if needed, 
    // but heavy models load on demand or in background
    await initSpeech();
    
    // Initialize Conversation Manager (WebLLM)
    // This will trigger model loading when the user starts, or we can pre-load
    await initConversation();
    
    console.log('App initialized');
});
