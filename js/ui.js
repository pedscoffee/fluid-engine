import { UserPreferences } from './preferences.js';
import { SpanishTutorPromptBuilder } from './promptBuilder.js';
import { getConversationManager } from './conversation.js';
import { getSpeechService } from './speech.js';
import { scenarios } from './scenarios.js';
import { initTutor, getTutorManager } from './tutor.js';

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
    const muteToggle = document.getElementById('mute-toggle');
    const voiceSelect = document.getElementById('voice-select');
    const closeSettingsBtn = document.getElementById('close-settings-btn');

    // Tutor Panel Elements
    const csvUpload = document.getElementById('csv-upload');
    const importCsvBtn = document.getElementById('import-csv-btn');
    const tutorPanel = document.getElementById('tutor-panel');
    const tutorChat = document.getElementById('tutor-chat');
    const toggleTutorBtn = document.getElementById('toggle-tutor-btn');
    const tutorInput = document.getElementById('tutor-input');
    const tutorSendBtn = document.getElementById('tutor-send-btn');
    const tutorSettingsBtn = document.getElementById('tutor-settings-btn');
    const tutorInstructions = document.getElementById('tutor-instructions');
    const tutorPreset = document.getElementById('tutor-preset');
    const tutorCustomInstruction = document.getElementById('tutor-custom-instruction');
    const tutorApplyBtn = document.getElementById('tutor-apply-btn');

    // Dark Mode Toggle
    const darkModeToggle = document.getElementById('dark-mode-toggle');

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

    if (prefs.muted !== undefined) {
        muteToggle.checked = prefs.muted;
    }

    // Initialize dark mode
    if (prefs.darkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        darkModeToggle.checked = true;
    }

    // Initialize tutor preset
    if (prefs.tutorInstruction) {
        tutorPreset.value = prefs.tutorInstruction;
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

            // Init Tutor
            loadingText.textContent = "Initializing AI Tutor...";
            await initTutor(conversationManager);

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

            // Speak greeting (async, don't await blocking UI)
            speechService.speak(greetingObj.spanish, newPrefs);

            // No tutor feedback on initial greeting (it's from AI)

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

    // Tutor Panel Logic
    function toggleTutorPanel(show) {
        if (show === undefined) {
            tutorPanel.classList.toggle('collapsed');
        } else if (show) {
            tutorPanel.classList.remove('collapsed');
        } else {
            tutorPanel.classList.add('collapsed');
        }
    }

    if (toggleTutorBtn) {
        toggleTutorBtn.addEventListener('click', () => toggleTutorPanel());
    }

    // Dark Mode Toggle
    darkModeToggle.addEventListener('change', () => {
        const isDark = darkModeToggle.checked;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        preferences.update({ darkMode: isDark });
    });

    // Tutor Settings Toggle
    tutorSettingsBtn.addEventListener('click', () => {
        tutorInstructions.classList.toggle('collapsed');
    });

    // Tutor Preset Selection
    tutorPreset.addEventListener('change', () => {
        const preset = tutorPreset.value;
        if (preset === 'custom') {
            tutorCustomInstruction.classList.remove('hidden');
        } else {
            tutorCustomInstruction.classList.add('hidden');
        }
        preferences.update({ tutorInstruction: preset });
    });

    // Tutor Apply Button
    tutorApplyBtn.addEventListener('click', async () => {
        const tutorManager = getTutorManager();
        if (!tutorManager) return;

        const preset = tutorPreset.value;
        let instruction;

        switch (preset) {
            case 'translation':
                instruction = 'Translate the Spanish message to English. Output ONLY the translation.';
                break;
            case 'grammar':
                instruction = 'Analyze the student\'s Spanish message. Translate it to English and explain any grammar patterns used.';
                break;
            case 'verbs':
                instruction = 'Analyze the student\'s Spanish message. Point out any irregular verbs in the message and explain their conjugations. Also provide the English translation.';
                break;
            case 'vocabulary':
                instruction = 'Analyze the student\'s Spanish message. Translate it to English and suggest related vocabulary words that would be helpful.';
                break;
            case 'mistakes':
                instruction = 'Analyze the student\'s Spanish message. Identify any common learner mistakes, explain the correct usage, and provide the English translation.';
                break;
            case 'custom':
                instruction = tutorCustomInstruction.value.trim();
                if (!instruction) {
                    alert('Please enter a custom instruction.');
                    return;
                }
                break;
        }

        tutorManager.setInstruction(instruction);
        addTutorMessage(`Tutor focus updated: ${preset === 'custom' ? instruction : preset}`, 'system');
        tutorInstructions.classList.add('collapsed');
    });

    // Tutor Q&A
    tutorSendBtn.addEventListener('click', handleTutorQuestion);

    tutorInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleTutorQuestion();
        }
    });

    // Helpers
    function addMessage(text, sender) {
        const div = document.createElement('div');
        div.className = `message ${sender}`;

        div.textContent = text;
        chatContainer.appendChild(div);
        scrollToBottom();
    }

    function addTutorMessage(text, sender) {
        if (!text) return;

        // Clear placeholder if it exists
        const placeholder = tutorChat.querySelector('.tutor-placeholder');
        if (placeholder) placeholder.remove();

        const div = document.createElement('div');
        div.className = `tutor-message ${sender}`;
        div.textContent = text;
        tutorChat.appendChild(div);
        tutorChat.scrollTop = tutorChat.scrollHeight;
    }

    async function handleTutorQuestion() {
        const question = tutorInput.value.trim();
        if (!question) return;

        addTutorMessage(question, 'user');
        tutorInput.value = '';

        // Show typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'tutor-message tutor typing-indicator';
        typingIndicator.innerHTML = '<span></span><span></span><span></span>';
        tutorChat.appendChild(typingIndicator);
        tutorChat.scrollTop = tutorChat.scrollHeight;

        const tutorManager = getTutorManager();
        if (tutorManager) {
            const answer = await tutorManager.answerQuestion(question);
            typingIndicator.remove();
            if (answer) {
                addTutorMessage(answer, 'tutor');
            }
        } else {
            typingIndicator.remove();
            addTutorMessage('Tutor is not initialized yet.', 'system');
        }
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

        // Pass 2: Get tutor feedback asynchronously
        const tutorManager = getTutorManager();
        if (tutorManager) {
            const currentPreset = preferences.get().tutorInstruction || 'translation';

            if (currentPreset === 'translation') {
                // Target AI response for translation
                tutorManager.provideFeedback(responseObj.spanish, 'ai').then(feedback => {
                    if (feedback) {
                        addTutorMessage(feedback, 'tutor');
                    }
                });
            } else {
                // Target User input for feedback
                tutorManager.provideFeedback(text, 'user').then(feedback => {
                    if (feedback) {
                        addTutorMessage(feedback, 'tutor');
                    }
                });
            }
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
