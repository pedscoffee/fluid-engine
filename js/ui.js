import { UserPreferences } from './preferences.js';
import { SpanishTutorPromptBuilder } from './promptBuilder.js';
import { getConversationManager } from './conversation.js';
import { getSpeechService } from './speech.js';
import { scenarios } from './scenarios.js';

export function initUI() {
    const preferences = new UserPreferences();
    const prefs = preferences.get();

    // DOM Elements
    const setupScreen = document.getElementById('setup-screen');
    const conversationScreen = document.getElementById('conversation-screen');
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');
    const loadingDetail = document.getElementById('loading-detail');
    const progressBar = document.getElementById('progress-bar');
    const progressContainer = document.getElementById('progress-container');

    const startBtn = document.getElementById('start-btn');
    const backBtn = document.getElementById('back-btn');
    const micBtn = document.getElementById('mic-btn');
    const chatContainer = document.getElementById('chat-container');
    const adjustBtn = document.getElementById('adjust-practice-btn');
    const adjustModal = document.getElementById('adjust-modal');
    const cancelAdjustBtn = document.getElementById('cancel-adjust-btn');
    const confirmAdjustBtn = document.getElementById('confirm-adjust-btn');
    const adjustInput = document.getElementById('adjust-input');
    const practiceGoalInput = document.getElementById('practice-goal');
    const scenarioSelect = document.getElementById('scenario-select');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const clearChatBtn = document.getElementById('clear-chat-btn');
    const settingsModal = document.getElementById('settings-modal');
    const translationToggle = document.getElementById('translation-toggle');
    const muteToggle = document.getElementById('mute-toggle');
    const voiceSelect = document.getElementById('voice-select');
    const closeSettingsBtn = document.getElementById('close-settings-btn');

    // Initialize inputs with saved prefs
    if (prefs.skillLevel) {
        const el = document.querySelector(`input[name="skill-level"][value="${prefs.skillLevel}"]`);
        if (el) el.checked = true;
    }
    if (prefs.showTranslation !== undefined) {
        translationToggle.checked = prefs.showTranslation;
    }
    if (prefs.muted !== undefined) {
        muteToggle.checked = prefs.muted;
    }

    // Populate voice dropdown when voices are loaded
    function populateVoices() {
        const voices = window.speechSynthesis.getVoices();
        const spanishVoices = voices.filter(v => v.lang.includes('es'));

        voiceSelect.innerHTML = '<option value="">Default</option>';
        spanishVoices.forEach((voice, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${voice.name} (${voice.lang})`;
            voiceSelect.appendChild(option);
        });

        if (prefs.selectedVoice !== undefined) {
            voiceSelect.value = prefs.selectedVoice;
        }
    }

    // Voices load asynchronously in some browsers
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = populateVoices;
    }
    populateVoices();

    // Check for saved session on load
    checkForSavedSession();

    // Scenario selection handler
    scenarioSelect.addEventListener('change', () => {
        const selectedScenario = scenarioSelect.value;
        if (selectedScenario && scenarios[selectedScenario]) {
            practiceGoalInput.value = scenarios[selectedScenario].instruction;
        } else {
            practiceGoalInput.value = '';
        }
    });

    // Event Listeners
    startBtn.addEventListener('click', async () => {
        // 1. Gather preferences
        const skillLevel = document.querySelector('input[name="skill-level"]:checked').value;
        const customGoal = practiceGoalInput.value.trim();

        // Parse natural language goal
        const parsed = SpanishTutorPromptBuilder.parseNaturalInstruction(customGoal);

        const newPrefs = {
            skillLevel,
            grammarFocus: parsed.grammarFocus,
            vocabularyFocus: parsed.vocabularyFocus,
            customInstructions: parsed.customInstructions
        };

        preferences.update(newPrefs);

        // 2. Show loading
        loadingOverlay.classList.remove('hidden');
        progressContainer.classList.remove('hidden');

        try {
            // 3. Initialize Services
            const conversationManager = await getConversationManager();
            const speechService = await getSpeechService();

            // Listen for model progress
            document.addEventListener('model-progress', (e) => {
                const { model, status, progress } = e.detail;
                if (status === 'progress') {
                    loadingDetail.textContent = `Loading ${model}... ${Math.round(progress)}%`;
                    progressBar.style.width = `${progress}%`;
                } else if (status === 'done') {
                    loadingDetail.textContent = `${model} ready.`;
                }
            });

            // Init LLM
            loadingText.textContent = "Loading AI Tutor...";
            await conversationManager.init((report) => {
                // Map WebLLM progress to UI
                // report.text is a string description
                loadingDetail.textContent = report.text;
                // Try to parse percentage if available, otherwise indeterminate
            });

            // Init Speech
            loadingText.textContent = "Loading Speech Engine...";
            await speechService.init();

            // 4. Start Conversation
            conversationManager.startConversation(newPrefs);

            // 5. Generate Greeting
            // We'll ask the LLM to generate the first message based on the prompt
            loadingText.textContent = "Starting conversation...";
            const greeting = await conversationManager.generateResponse("Hola"); // Trigger first response
            addMessage(greeting, 'system');

            // Speak greeting
            await speechService.speak(greeting, newPrefs);

            // 6. Switch Screens
            loadingOverlay.classList.add('hidden');
            setupScreen.classList.remove('active');
            setupScreen.classList.add('hidden');
            conversationScreen.classList.remove('hidden');
            conversationScreen.classList.add('active');

            // Save initial state
            conversationManager.saveToStorage();

        } catch (error) {
            console.error(error);
            alert("Error initializing: " + error.message);
            loadingOverlay.classList.add('hidden');
        }
    });

    backBtn.addEventListener('click', () => {
        conversationScreen.classList.remove('active');
        conversationScreen.classList.add('hidden');
        setupScreen.classList.remove('hidden');
        setupScreen.classList.add('active');
        // Ideally we should reset conversation state here
    });

    // Push to Talk Logic
    let isListening = false;

    const startListening = async () => {
        if (isListening) return;
        isListening = true;
        micBtn.classList.add('listening');
        const speechService = await getSpeechService();
        await speechService.startRecording();
    };

    const stopListening = async () => {
        if (!isListening) return;
        isListening = false;
        micBtn.classList.remove('listening');

        const speechService = await getSpeechService();
        const text = await speechService.stopRecording();

        if (text) {
            handleUserMessage(text);
        }
    };

    // Mouse events
    micBtn.addEventListener('mousedown', startListening);
    micBtn.addEventListener('mouseup', stopListening);
    micBtn.addEventListener('mouseleave', stopListening);

    // Touch events for mobile
    micBtn.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent mouse emulation
        startListening();
    });
    micBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        stopListening();
    });

    // Adjust Practice Modal
    adjustBtn.addEventListener('click', () => {
        adjustModal.classList.remove('hidden');
        adjustInput.focus();
    });

    cancelAdjustBtn.addEventListener('click', () => {
        adjustModal.classList.add('hidden');
    });

    confirmAdjustBtn.addEventListener('click', async () => {
        const instruction = adjustInput.value.trim();
        if (instruction) {
            const conversationManager = await getConversationManager();
            await conversationManager.injectSystemInstruction(instruction);
            adjustModal.classList.add('hidden');
            adjustInput.value = '';

            // Add a visual indicator in chat
            const note = document.createElement('div');
            note.className = 'status-indicator';
            note.style.justifyContent = 'center';
            note.style.padding = '10px';
            note.textContent = `Practice focus updated: "${instruction}"`;
            chatContainer.appendChild(note);
            scrollToBottom();

            // Trigger a response acknowledging the change
            const response = await conversationManager.generateResponse(`[System: User changed focus to "${instruction}". Acknowledge this change naturally in Spanish.]`);
            addMessage(response, 'system');
            const speechService = await getSpeechService();
            const currentPrefs = preferences.get();
            await speechService.speak(response, currentPrefs);
        }
    });

    // Text Input Handlers
    sendBtn.addEventListener('click', () => {
        const text = chatInput.value.trim();
        if (text) {
            handleUserMessage(text);
            chatInput.value = '';
        }
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const text = chatInput.value.trim();
            if (text) {
                handleUserMessage(text);
                chatInput.value = '';
            }
        }
    });

    // Clear Chat Handler
    clearChatBtn.addEventListener('click', async () => {
        if (confirm('Clear all messages and start fresh?')) {
            // Clear UI
            const systemGreeting = chatContainer.querySelector('.message.system');
            chatContainer.innerHTML = '';
            if (systemGreeting) {
                chatContainer.appendChild(systemGreeting.cloneNode(true));
            }

            // Reset conversation manager
            const conversationManager = await getConversationManager();
            conversationManager.reset();

            // Restart with current preferences
            const currentPrefs = preferences.get();
            conversationManager.startConversation(currentPrefs);
        }
    });

    // Settings Modal Handlers
    const settingsBtn = document.getElementById('settings-btn');
    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
    });

    closeSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
    });

    // Keyboard accessibility for modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!settingsModal.classList.contains('hidden')) {
                settingsModal.classList.add('hidden');
            }
            if (!adjustModal.classList.contains('hidden')) {
                adjustModal.classList.add('hidden');
            }
        }
    });

    translationToggle.addEventListener('change', () => {
        preferences.update({ showTranslation: translationToggle.checked });
    });

    muteToggle.addEventListener('change', () => {
        preferences.update({ muted: muteToggle.checked });
    });

    voiceSelect.addEventListener('change', () => {
        preferences.update({ selectedVoice: voiceSelect.value });
    });

    // Helpers
    function addMessage(text, sender) {
        const div = document.createElement('div');
        div.className = `message ${sender}`;

        // Parse translation if present (format: "Spanish text\n[EN] English translation")
        const translationMatch = text.match(/^([\s\S]*?)\n\[EN\]\s*(.+)$/i);

        if (translationMatch && sender === 'system') {
            const spanishText = translationMatch[1].trim();
            const englishText = translationMatch[2].trim();

            div.classList.add('has-translation');
            div.textContent = spanishText;

            // Add tooltip
            const tooltip = document.createElement('div');
            tooltip.className = 'translation-tooltip';
            tooltip.textContent = englishText;
            div.appendChild(tooltip);
        } else {
            div.textContent = text;
        }

        chatContainer.appendChild(div);
        scrollToBottom();
    }

    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    async function handleUserMessage(text) {
        addMessage(text, 'user');

        // Show typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message system typing-indicator';
        typingIndicator.innerHTML = '<span></span><span></span><span></span>';
        chatContainer.appendChild(typingIndicator);
        scrollToBottom();

        const conversationManager = await getConversationManager();
        const response = await conversationManager.generateResponse(text);

        // Remove typing indicator
        typingIndicator.remove();

        addMessage(response, 'system');

        // Save conversation after each exchange
        conversationManager.saveToStorage();

        const speechService = await getSpeechService();
        await speechService.speak(response, preferences.get());
    }

    async function checkForSavedSession() {
        const conversationManager = await getConversationManager();
        const savedData = conversationManager.loadFromStorage();

        if (savedData) {
            const resume = confirm('You have a previous session. Would you like to resume it?');
            if (resume) {
                await resumeSession(savedData);
            } else {
                conversationManager.clearStorage();
            }
        }
    }

    async function resumeSession(savedData) {
        try {
            loadingOverlay.classList.remove('hidden');
            loadingText.textContent = "Resuming session...";

            // Initialize services
            const conversationManager = await getConversationManager();
            const speechService = await getSpeechService();

            await conversationManager.init();
            await speechService.init();

            // Restore conversation state
            conversationManager.restoreFromData(savedData);

            // Restore UI messages (excluding system messages)
            chatContainer.innerHTML = '';
            for (const msg of savedData.messages) {
                if (msg.role === 'user') {
                    addMessage(msg.content, 'user');
                } else if (msg.role === 'assistant') {
                    addMessage(msg.content, 'system');
                }
            }

            // Switch to conversation screen
            loadingOverlay.classList.add('hidden');
            setupScreen.classList.remove('active');
            setupScreen.classList.add('hidden');
            conversationScreen.classList.remove('hidden');
            conversationScreen.classList.add('active');
        } catch (error) {
            console.error('Resume error:', error);
            alert('Failed to resume session: ' + error.message);
            conversationManager.clearStorage();
            loadingOverlay.classList.add('hidden');
        }
    }
}
