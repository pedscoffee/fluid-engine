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

    // Mode Inputs
    const modeRadios = document.querySelectorAll('input[name="mode"]');
    const beginnerInputs = document.getElementById('beginner-inputs');
    const intermediateInputs = document.getElementById('intermediate-inputs');
    const advancedInputs = document.getElementById('advanced-inputs');
    const vocabListInput = document.getElementById('vocab-list');
    const sharedScenarioInputs = document.getElementById('shared-scenario-inputs');

    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const clearChatBtn = document.getElementById('clear-chat-btn');
    const settingsModal = document.getElementById('settings-modal');
    const translationToggle = document.getElementById('translation-toggle');
    const muteToggle = document.getElementById('mute-toggle');
    const voiceSelect = document.getElementById('voice-select');
    const closeSettingsBtn = document.getElementById('close-settings-btn');

    // New DOM Elements
    const csvUpload = document.getElementById('csv-upload');
    const importCsvBtn = document.getElementById('import-csv-btn');
    const translationPanel = document.getElementById('translation-panel');
    const translationContent = document.getElementById('translation-content');
    const toggleTranslationBtn = document.getElementById('toggle-translation-btn');
    const togglePanelBtn = document.getElementById('toggle-panel-btn'); // If we added one inside the panel header too

    // Initialize inputs with saved prefs
    if (prefs.mode) {
        const el = document.querySelector(`input[name="mode"][value="${prefs.mode}"]`);
        if (el) {
            el.checked = true;
            updateModeVisibility(prefs.mode);
        }
    }
    if (prefs.targetVocabulary) {
        vocabListInput.value = prefs.targetVocabulary;
    }
    if (prefs.selectedGrammar) {
        prefs.selectedGrammar.forEach(g => {
            const el = document.querySelector(`input[name="grammar"][value="${g}"]`);
            if (el) el.checked = true;
        });
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

    // Mode switching handler
    modeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            updateModeVisibility(e.target.value);
        });
    });

    function updateModeVisibility(mode) {
        // Hide all first
        beginnerInputs.classList.add('hidden');
        intermediateInputs.classList.add('hidden');
        advancedInputs.classList.add('hidden');
        sharedScenarioInputs.classList.add('hidden');

        // Vocabulary is now shared, so we don't hide it based on mode
        // But we might want to show/hide specific hints if needed. 
        // For now, it stays visible.

        // Show selected
        // Show selected
        if (mode === 'beginner') {
            beginnerInputs.classList.remove('hidden');
        } else if (mode === 'intermediate') {
            intermediateInputs.classList.remove('hidden');
            sharedScenarioInputs.classList.remove('hidden');
        } else if (mode === 'advanced') {
            advancedInputs.classList.remove('hidden');
            sharedScenarioInputs.classList.remove('hidden');
        }
    }

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
        const selectedMode = document.querySelector('input[name="mode"]:checked').value;
        const selectedGrammar = Array.from(document.querySelectorAll('input[name="grammar"]:checked')).map(cb => cb.value);

        const newPrefs = {
            mode: selectedMode,
            targetVocabulary: vocabListInput.value.trim(),
            selectedGrammar: selectedGrammar,
            customInstructions: practiceGoalInput.value.trim(),
            // Keep existing prefs
            showTranslation: translationToggle.checked,
            muted: muteToggle.checked
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
            const greetingObj = await conversationManager.generateResponse("Hola"); // Trigger first response

            // 6. Switch Screens IMMEDIATELY so user sees the text
            loadingOverlay.classList.add('hidden');
            setupScreen.classList.remove('active');
            setupScreen.classList.add('hidden');
            conversationScreen.classList.remove('hidden');
            conversationScreen.classList.add('active');

            addMessage(greetingObj.spanish, 'system');

            // Save initial state
            conversationManager.saveToStorage();

            // Speak greeting (async, don't await blocking UI)
            speechService.speak(greetingObj.spanish, newPrefs);

            // Translate greeting if enabled
            if (newPrefs.showTranslation) {
                conversationManager.translateText(greetingObj.spanish).then(translation => {
                    if (translation) {
                        updateSidePanel(translation);
                    }
                });
            }

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

    // CSV Import Logic
    importCsvBtn.addEventListener('click', () => {
        csvUpload.click();
    });

    csvUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            // Simple CSV parse: assume comma separated, maybe newlines
            // We want to extract words and join them with commas
            const words = text.split(/[\n,]+/).map(w => w.trim()).filter(w => w.length > 0);

            if (words.length > 0) {
                const currentVal = vocabListInput.value.trim();
                const newVal = words.join(', ');
                vocabListInput.value = currentVal ? `${currentVal}, ${newVal}` : newVal;
                alert(`Imported ${words.length} words.`);
            }
        };
        reader.readAsText(file);
        // Reset input so same file can be selected again
        csvUpload.value = '';
    });

    // Side Panel Logic
    function toggleSidePanel(show) {
        if (show === undefined) {
            translationPanel.classList.toggle('collapsed');
        } else if (show) {
            translationPanel.classList.remove('collapsed');
        } else {
            translationPanel.classList.add('collapsed');
        }
    }

    if (toggleTranslationBtn) {
        toggleTranslationBtn.addEventListener('click', () => toggleSidePanel());
    }

    // Also allow closing from within the panel if we added a close button (optional)
    // if (togglePanelBtn) togglePanelBtn.addEventListener('click', () => toggleSidePanel(false));

    // Helpers
    function addMessage(text, sender) {
        const div = document.createElement('div');
        div.className = `message ${sender}`;

        div.textContent = text;
        chatContainer.appendChild(div);
        scrollToBottom();
    }

    function updateSidePanel(englishText) {
        if (!englishText) return;

        const p = document.createElement('p');
        p.style.marginBottom = '1rem';
        p.style.borderBottom = '1px solid var(--surface-light)';
        p.style.paddingBottom = '0.5rem';
        p.textContent = englishText;

        // Clear placeholder if it exists
        const placeholder = translationContent.querySelector('.placeholder');
        if (placeholder) placeholder.remove();

        translationContent.appendChild(p);
        translationContent.scrollTop = translationContent.scrollHeight;

        // Auto-open logic removed per user request
        // The panel will stay closed unless manually opened
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
        const responseObj = await conversationManager.generateResponse(text);

        // Remove typing indicator
        typingIndicator.remove();

        // Pass 1: Display Spanish immediately
        addMessage(responseObj.spanish, 'system');

        // Save conversation
        conversationManager.saveToStorage();

        const speechService = await getSpeechService();

        // Speak Spanish immediately
        speechService.speak(responseObj.spanish, preferences.get());

        // Pass 2: Translate asynchronously if enabled
        if (preferences.get().showTranslation) {
            // Show a loading state in side panel?
            // For now just fetch and append
            conversationManager.translateText(responseObj.spanish).then(translation => {
                if (translation) {
                    updateSidePanel(translation);
                }
            });
        }
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
