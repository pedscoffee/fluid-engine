import { UserPreferences } from './preferences.js';
import { SpanishTutorPromptBuilder } from './promptBuilder.js';
import { getConversationManager, initConversation } from './conversation.js';
import { getSpeechService } from './speech.js';
import { scenarios } from './scenarios.js';
import { initTutor, getTutorManager } from './tutor.js';

// Lazy load Anki module only when needed
let ankiDataManager = null;
async function getAnkiDataManager() {
    if (!ankiDataManager) {
        const module = await import('./ankiData.js');
        ankiDataManager = module.ankiDataManager;
    }
    return ankiDataManager;
}

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
    const practiceGoalInput = document.getElementById('practice-goal');
    const scenarioSelect = document.getElementById('scenario-select');

    // Mode Inputs
    // difficultySelect removed, using querySelector for radios
    const vocabListInput = document.getElementById('vocab-list');

    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const clearChatBtn = document.getElementById('clear-chat-btn');
    const settingsModal = document.getElementById('settings-modal');
    const muteToggle = document.getElementById('mute-toggle');
    const voiceSelect = document.getElementById('voice-select');
    const closeSettingsBtn = document.getElementById('close-settings-btn');

    // Debug Modal Elements
    const debugPromptBtn = document.getElementById('debug-prompt-btn');
    const debugPromptModal = document.getElementById('debug-prompt-modal');
    const debugPromptContent = document.getElementById('debug-prompt-content');
    const closeDebugPromptBtn = document.getElementById('close-debug-prompt-btn');
    const copyPromptBtn = document.getElementById('copy-prompt-btn');

    // Tutor Panel Elements
    const csvUpload = document.getElementById('csv-upload');
    const importCsvBtn = document.getElementById('import-csv-btn');

    // Anki Import Elements
    const ankiApkgUpload = document.getElementById('anki-apkg-upload');
    const ankiTsvUpload = document.getElementById('anki-tsv-upload');
    const importApkgBtn = document.getElementById('import-apkg-btn');
    const importTsvBtn = document.getElementById('import-tsv-btn');
    const ankiStats = document.getElementById('anki-stats');
    const clearAnkiBtn = document.getElementById('clear-anki-btn');
    const tsvImportModal = document.getElementById('tsv-import-modal');
    const confirmTsvBtn = document.getElementById('confirm-tsv-btn');
    const cancelTsvBtn = document.getElementById('cancel-tsv-btn');

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
    if (prefs.difficultyLevel) {
        const el = document.querySelector(`input[name="difficulty"][value="${prefs.difficultyLevel}"]`);
        if (el) el.checked = true;
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

    // Initialize tutor language
    if (prefs.tutorLanguage) {
        const langRadio = document.querySelector(`input[name="tutor-lang"][value="${prefs.tutorLanguage}"]`);
        if (langRadio) langRadio.checked = true;
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

    // Initialize onboarding for first-time users
    initOnboarding();

    // Initialize PWA install prompt
    initPWAInstall();

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
        const selectedDifficulty = document.querySelector('input[name="difficulty"]:checked').value;
        const selectedGrammar = Array.from(document.querySelectorAll('input[name="grammar"]:checked')).map(cb => cb.value);

        const newPrefs = {
            difficultyLevel: selectedDifficulty,
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

    // Debug Prompt Modal Handlers
    debugPromptBtn.addEventListener('click', () => {
        const conversationManager = getConversationManager();
        if (conversationManager) {
            const systemPrompt = conversationManager.getSystemPrompt();
            if (systemPrompt) {
                debugPromptContent.textContent = systemPrompt;
            } else {
                debugPromptContent.textContent = "No system prompt generated yet. Start a conversation to see it.";
            }
        } else {
            debugPromptContent.textContent = "Conversation manager not initialized.";
        }
        debugPromptModal.classList.remove('hidden');
    });

    closeDebugPromptBtn.addEventListener('click', () => {
        debugPromptModal.classList.add('hidden');
    });

    copyPromptBtn.addEventListener('click', async () => {
        const text = debugPromptContent.textContent;
        try {
            await navigator.clipboard.writeText(text);
            copyPromptBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyPromptBtn.textContent = 'Copy to Clipboard';
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            copyPromptBtn.textContent = 'Failed to copy';
            setTimeout(() => {
                copyPromptBtn.textContent = 'Copy to Clipboard';
            }, 2000);
        }
    });

    // Keyboard accessibility for modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!settingsModal.classList.contains('hidden')) {
                settingsModal.classList.add('hidden');
            }
            if (!debugPromptModal.classList.contains('hidden')) {
                debugPromptModal.classList.add('hidden');
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

    // Anki Import Logic
    async function updateAnkiStats() {
        const manager = await getAnkiDataManager();
        const stats = manager.getStatistics();
        if (stats.totalVocabulary > 0) {
            ankiStats.classList.remove('hidden');
            document.getElementById('anki-deck-count').textContent = stats.decks;
            document.getElementById('anki-vocab-count').textContent = stats.totalVocabulary;
            document.getElementById('anki-mastered-count').textContent = stats.mastered;
            document.getElementById('anki-familiar-count').textContent = stats.familiar;
            document.getElementById('anki-learning-count').textContent = stats.learning;
            document.getElementById('anki-new-count').textContent = stats.new;
        } else {
            ankiStats.classList.add('hidden');
        }
    }

    // Initialize Anki stats on load (async)
    updateAnkiStats();

    // APKG Import
    importApkgBtn.addEventListener('click', () => {
        ankiApkgUpload.click();
    });

    ankiApkgUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        loadingOverlay.classList.remove('hidden');
        loadingText.textContent = 'Importing Anki Deck...';
        loadingDetail.textContent = 'Parsing APKG file and extracting vocabulary';

        try {
            const manager = await getAnkiDataManager();
            const result = await manager.importAPKG(file);

            if (result.success) {
                await updateAnkiStats();
                alert(`Success! Imported ${result.cardCount} cards with ${result.vocabularyCount} unique vocabulary items from "${result.deckName}".`);
            } else {
                alert(`Import failed: ${result.error}`);
            }
        } catch (error) {
            console.error('Error importing APKG:', error);
            alert(`Import failed: ${error.message}`);
        } finally {
            loadingOverlay.classList.add('hidden');
            ankiApkgUpload.value = ''; // Reset for next import
        }
    });

    // TSV Import - Show modal first
    let pendingTsvFile = null;

    importTsvBtn.addEventListener('click', () => {
        ankiTsvUpload.click();
    });

    ankiTsvUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        pendingTsvFile = file;
        tsvImportModal.classList.remove('hidden');
        ankiTsvUpload.value = ''; // Reset
    });

    confirmTsvBtn.addEventListener('click', async () => {
        if (!pendingTsvFile) return;

        const masteryLevel = document.querySelector('input[name="tsv-mastery"]:checked')?.value || 'familiar';
        tsvImportModal.classList.add('hidden');

        loadingOverlay.classList.remove('hidden');
        loadingText.textContent = 'Importing Text File...';
        loadingDetail.textContent = 'Processing vocabulary';

        try {
            const manager = await getAnkiDataManager();
            const result = await manager.importTSV(pendingTsvFile, masteryLevel);

            if (result.success) {
                await updateAnkiStats();
                alert(`Success! Imported ${result.cardCount} cards with ${result.vocabularyCount} unique vocabulary items from "${result.deckName}" as "${masteryLevel}" level.`);
            } else {
                alert(`Import failed: ${result.error}`);
            }
        } catch (error) {
            console.error('Error importing TSV:', error);
            alert(`Import failed: ${error.message}`);
        } finally {
            loadingOverlay.classList.add('hidden');
            pendingTsvFile = null;
        }
    });

    cancelTsvBtn.addEventListener('click', () => {
        tsvImportModal.classList.add('hidden');
        pendingTsvFile = null;
    });

    // Clear Anki Data
    clearAnkiBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to clear all imported Anki data? This cannot be undone.')) {
            const manager = await getAnkiDataManager();
            manager.clearAllData();
            await updateAnkiStats();
            alert('Anki data cleared successfully.');
        }
    });

    // Export Anki Data
    const exportAnkiBtn = document.getElementById('export-anki-btn');
    if (exportAnkiBtn) {
        exportAnkiBtn.addEventListener('click', async () => {
            const manager = await getAnkiDataManager();
            const decks = manager.data.decks;

            if (decks.length === 0) {
                alert('No decks to export.');
                return;
            }

            // Export the first deck (or merge them - for now just the first one or a merged one)
            // Let's create a merged deck for export
            const mergedDeck = {
                name: "Soltura Export",
                cards: decks.flatMap(d => d.cards)
            };

            try {
                loadingOverlay.classList.remove('hidden');
                loadingText.textContent = 'Generating Anki Package...';
                loadingDetail.textContent = 'Creating database and compressing files';

                const blob = await manager.exportAPKG(mergedDeck);
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'Soltura_Export.apkg';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Export failed:', error);
                alert('Failed to export deck. See console for details.');
            } finally {
                loadingOverlay.classList.add('hidden');
            }
        });
    }

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

    // Tutor Language Toggle - Immediate Update
    const langRadios = document.querySelectorAll('input[name="tutor-lang"]');
    langRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                preferences.update({ tutorLanguage: e.target.value });
                // Optional: visual feedback
                addTutorMessage(`Feedback language set to: ${e.target.value}`, 'system');
            }
        });
    });

    // Tutor Apply Button
    tutorApplyBtn.addEventListener('click', async () => {
        const tutorManager = getTutorManager();
        if (!tutorManager) return;

        // Save language preference
        const selectedLang = document.querySelector('input[name="tutor-lang"]:checked').value;
        preferences.update({ tutorLanguage: selectedLang });

        const preset = tutorPreset.value;
        let instruction;

        /* 
           TUTOR PRESET CONFIGURATION
           To add or remove presets:
           1. Add/Remove option in index.html <select id="tutor-preset">
           2. Add/Remove case below with the specific prompt instruction.
           
           Note: 'translation' is special - it disables student feedback and only shows teacher translation.
           All other presets will trigger student feedback IN ADDITION to teacher translation.
        */
        switch (preset) {
            case 'translation':
                // This instruction is actually not used for the teacher translation (which is fixed),
                // but it marks the mode as "translation only" so we don't trigger student analysis.
                instruction = 'Output ONLY the translation.';
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

        // Use DocumentFragment to minimize reflows
        const fragment = document.createDocumentFragment();
        fragment.appendChild(div);
        chatContainer.appendChild(fragment);

        // Defer scroll to next frame for better performance
        requestAnimationFrame(() => scrollToBottom());
    }

    function addTutorMessage(text, sender) {
        if (!text) return;

        // Clear placeholder if it exists
        const placeholder = tutorChat.querySelector('.tutor-placeholder');
        if (placeholder) placeholder.remove();

        const div = document.createElement('div');
        div.className = `tutor-message ${sender}`;
        // Use marked to render markdown content safely
        // Since this is a local app and content comes from AI, basic marked usage is acceptable.
        // If sender is 'user', we just show text.
        if (sender === 'user') {
            div.textContent = text;
        } else {
            div.innerHTML = marked.parse(text);
        }

        // Use DocumentFragment for better performance
        const fragment = document.createDocumentFragment();
        fragment.appendChild(div);
        tutorChat.appendChild(fragment);

        // Defer scroll to next frame
        requestAnimationFrame(() => {
            tutorChat.scrollTop = tutorChat.scrollHeight;
        });
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

            // 1. Always get translation of the AI's response (Teacher)
            // This runs independently of the student feedback
            tutorManager.translateTeacherMessage(responseObj.spanish).then(translation => {
                if (translation) {
                    addTutorMessage(translation, 'tutor');
                }
            });

            // 2. If a specific feedback mode is selected (not just translation), get feedback on User's input (Student)
            // This runs independently of the teacher translation
            if (currentPreset !== 'translation') {
                // We need to get the instruction text corresponding to the preset
                // Ideally this should be stored or retrieved from a helper, but we can reconstruct it or fetch from prefs if we stored the full text.
                // For now, we'll re-derive it or better yet, let's store the instruction text in prefs or just re-map it here.
                // Actually, the tutorManager stores 'currentInstruction'.
                // But 'currentInstruction' in the previous logic was set by the apply button.
                // Let's use the tutorManager's current instruction, assuming it was set correctly by the UI.

                // However, the previous logic in tutor.js used 'currentInstruction' for everything.
                // We need to make sure 'currentInstruction' is what we want for the STUDENT analysis.
                // The 'translation' preset sets it to a translation prompt, which we don't want for student analysis.
                // So we should only call analyzeStudentMessage if the instruction is NOT the default translation one.

                const instruction = tutorManager.currentInstruction;
                const language = preferences.get().tutorLanguage || 'english';

                if (!instruction.includes("Output ONLY the translation")) {
                    tutorManager.analyzeStudentMessage(text, instruction, language).then(feedback => {
                        if (feedback) {
                            addTutorMessage(feedback, 'tutor');
                        }
                    });
                }
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

// Onboarding Functions
function initOnboarding() {
    const welcomeOverlay = document.getElementById('welcome-overlay');
    const skipOnboardingCheckbox = document.getElementById('skip-onboarding-checkbox');
    const onboardingSkipBtn = document.getElementById('onboarding-skip');
    const onboardingNextBtn = document.getElementById('onboarding-next');
    const onboardingStartBtn = document.getElementById('onboarding-start');

    let currentStep = 1;
    const totalSteps = 3;

    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem('soltura_has_seen_onboarding');

    if (!hasSeenOnboarding) {
        // Show onboarding after a short delay
        setTimeout(() => {
            welcomeOverlay.classList.remove('hidden');
        }, 500);
    }

    function updateStep(step) {
        // Hide all steps
        for (let i = 1; i <= totalSteps; i++) {
            document.getElementById(`onboarding-step-${i}`)?.classList.remove('active');
            document.querySelector(`.dot[data-step="${i}"]`)?.classList.remove('active');
        }

        // Show current step
        document.getElementById(`onboarding-step-${step}`)?.classList.add('active');
        document.querySelector(`.dot[data-step="${step}"]`)?.classList.add('active');

        // Update buttons
        if (step === totalSteps) {
            onboardingNextBtn.classList.add('hidden');
            onboardingStartBtn.classList.remove('hidden');
        } else {
            onboardingNextBtn.classList.remove('hidden');
            onboardingStartBtn.classList.add('hidden');
        }
    }

    // Next button
    onboardingNextBtn.addEventListener('click', () => {
        if (currentStep < totalSteps) {
            currentStep++;
            updateStep(currentStep);
        }
    });

    // Dot navigation
    document.querySelectorAll('.dot').forEach(dot => {
        dot.addEventListener('click', () => {
            const step = parseInt(dot.dataset.step);
            currentStep = step;
            updateStep(step);
        });
    });

    // Skip button
    onboardingSkipBtn.addEventListener('click', closeOnboarding);

    // Start button
    onboardingStartBtn.addEventListener('click', closeOnboarding);

    function closeOnboarding() {
        // Save preference if checkbox is checked
        if (skipOnboardingCheckbox.checked) {
            localStorage.setItem('soltura_has_seen_onboarding', 'true');
        }

        welcomeOverlay.classList.add('hidden');
    }
}

// PWA Install Functions
function initPWAInstall() {
    const pwaBanner = document.getElementById('pwa-install-banner');
    const pwaInstallBtn = document.getElementById('pwa-install-btn');
    const pwaDismissBtn = document.getElementById('pwa-dismiss-btn');

    let deferredPrompt = null;
    const hasDismissed = localStorage.getItem('soltura_pwa_dismissed');
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();

        // Stash the event so it can be triggered later
        deferredPrompt = e;

        // Don't show if already installed or user dismissed
        if (!isStandalone && !hasDismissed) {
            // Show the banner after a delay (5 seconds)
            setTimeout(() => {
                pwaBanner.classList.remove('hidden');
            }, 5000);
        }
    });

    // Install button handler
    pwaInstallBtn.addEventListener('click', async () => {
        if (!deferredPrompt) {
            return;
        }

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again; throw it away
        deferredPrompt = null;

        // Hide the banner
        pwaBanner.classList.add('hidden');
    });

    // Dismiss button handler
    pwaDismissBtn.addEventListener('click', () => {
        pwaBanner.classList.add('hidden');
        localStorage.setItem('soltura_pwa_dismissed', 'true');
    });

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
        console.log('PWA was installed');
        pwaBanner.classList.add('hidden');
        deferredPrompt = null;
    });
}
