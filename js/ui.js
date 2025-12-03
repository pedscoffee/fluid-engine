import { UserPreferences } from './preferences.js';
import { TemplateManager, PromptTemplate } from './promptTemplate.js';
import { DualThreadManager } from './dualThreadManager.js';
import { starterTemplates, initializeStarterTemplates } from './templateLibrary.js';
import { getSpeechService } from './speech.js';
import { initStatsManager, getStatsManager } from './statsManager.js';

export function initUI() {
    const preferences = new UserPreferences();
    const prefs = preferences.get();

    // Initialize template manager
    const templateManager = new TemplateManager();
    initializeStarterTemplates(templateManager);

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

    // Template Selection
    const templateSelect = document.getElementById('template-select');
    const templatePreview = document.getElementById('template-preview');
    const previewMainPersona = document.getElementById('preview-main-persona');
    const previewMainPrompt = document.getElementById('preview-main-prompt');
    const previewSidePersona = document.getElementById('preview-side-persona');
    const previewSidePrompt = document.getElementById('preview-side-prompt');

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

    // Tutor Panel Elements (now "Side Panel")

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

    // Populate template selector
    function populateTemplateSelector() {
        const templates = templateManager.getAllTemplates();
        templateSelect.innerHTML = '<option value="">-- Select a Template --</option>';

        templates.forEach(template => {
            const option = document.createElement('option');
            option.value = template.id;
            option.textContent = template.name;
            if (template.description) {
                option.title = template.description;
            }
            templateSelect.appendChild(option);
        });
    }

    populateTemplateSelector();

    // Template selection handler
    templateSelect.addEventListener('change', () => {
        const selectedTemplateId = templateSelect.value;

        if (selectedTemplateId) {
            const template = templateManager.getTemplate(selectedTemplateId);
            if (template) {
                // Show preview
                previewMainPersona.textContent = template.main.personaName;
                previewMainPrompt.textContent = template.main.systemPrompt;
                previewSidePersona.textContent = template.side.personaName;
                previewSidePrompt.textContent = template.side.systemPrompt;
                templatePreview.classList.remove('hidden');
            }
        } else {
            templatePreview.classList.add('hidden');
        }
    });

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

    // Initialize stats tracking
    initStatsManager();

    // Check for saved session on load
    checkForSavedSession();

    // Event Listeners
    startBtn.addEventListener('click', async () => {
        const selectedTemplateId = templateSelect.value;

        if (!selectedTemplateId) {
            alert('Please select a template');
            return;
        }

        const template = templateManager.getTemplate(selectedTemplateId);

        // Show loading
        loadingOverlay.classList.remove('hidden');
        progressContainer.classList.remove('hidden');

        try {
            // Initialize DualThreadManager with template
            const threadManager = new DualThreadManager(template);
            loadingText.textContent = "Loading AI Models...";

            await threadManager.init((report) => {
                loadingDetail.textContent = report.text;
            });

            // Init Speech
            const speechService = await getSpeechService();
            loadingText.textContent = "Loading Speech Engine...";
            await speechService.init();

            // Store globally for access in message handlers
            window.threadManager = threadManager;

            // Update side panel header with persona name
            document.getElementById('side-persona-name').textContent = template.side.personaName;

            // Start stats session
            const statsManager = getStatsManager();
            statsManager.startSession({ templateId: template.id, templateName: template.name });

            // Generate initial greeting
            loadingText.textContent = "Starting conversation...";
            const greeting = await threadManager.sendMainMessage('Hello');

            // Switch screens
            loadingOverlay.classList.add('hidden');
            setupScreen.classList.remove('active');
            setupScreen.classList.add('hidden');
            conversationScreen.classList.remove('hidden');
            conversationScreen.classList.add('active');

            addMessage(greeting.text, 'system');

            // TTS if enabled in template
            if (greeting.enableTTS) {
                speechService.speak(greeting.text, prefs);
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

        // End stats session
        const statsManager = getStatsManager();
        if (statsManager.isSessionActive()) {
            statsManager.endSession();
        }

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
    clearChatBtn.addEventListener('click', () => {
        if (confirm('Clear all messages and start fresh?')) {
            // Clear UI
            const systemGreeting = chatContainer.querySelector('.message.system');
            chatContainer.innerHTML = '';
            if (systemGreeting) {
                chatContainer.appendChild(systemGreeting.cloneNode(true));
            }

            // Clear side panel
            tutorChat.innerHTML = '<p class="tutor-placeholder">Ask questions or request commentary...</p>';

            // Reset thread manager
            if (window.threadManager) {
                window.threadManager.reset();
            }
        }
    });

    // Stats Dashboard Handlers
    const statsBtn = document.getElementById('stats-btn');
    const statsModal = document.getElementById('stats-modal');
    const closeStatsBtn = document.getElementById('close-stats-btn');
    const exportStatsBtn = document.getElementById('export-stats-btn');
    const clearStatsBtn = document.getElementById('clear-stats-btn');

    statsBtn.addEventListener('click', () => {
        const statsManager = getStatsManager();
        const summary = statsManager.getStatsSummary();
        updateStatsDashboard(summary);
        statsModal.classList.remove('hidden');
    });

    closeStatsBtn.addEventListener('click', () => {
        statsModal.classList.add('hidden');
    });

    exportStatsBtn.addEventListener('click', () => {
        const statsManager = getStatsManager();
        statsManager.exportData();
    });

    clearStatsBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to clear all progress data? This cannot be undone.')) {
            const statsManager = getStatsManager();
            await statsManager.clearAllStats();
            updateStatsDashboard(statsManager.getStatsSummary());
        }
    });

    // Save session on close
    window.addEventListener('beforeunload', () => {
        const statsManager = getStatsManager();
        if (statsManager.isSessionActive()) {
            statsManager.endSession();
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
        if (window.threadManager) {
            const systemPrompt = window.threadManager.getSystemPrompt();
            if (systemPrompt) {
                debugPromptContent.textContent = systemPrompt;
            } else {
                debugPromptContent.textContent = "No system prompt generated yet. Start a conversation to see it.";
            }
        } else {
            debugPromptContent.textContent = "Thread manager not initialized.";
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

        if (window.threadManager) {
            const answer = await window.threadManager.sendSideMessage(question);
            typingIndicator.remove();
            if (answer) {
                addTutorMessage(answer, 'tutor');
            }
        } else {
            typingIndicator.remove();
            addTutorMessage('Side panel is not initialized yet.', 'system');
        }
    }

    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    async function handleUserMessage(text) {
        addMessage(text, 'user');

        // Track user message
        const statsManager = getStatsManager();
        statsManager.trackMessage('user', text);

        // Show typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message system typing-indicator';
        typingIndicator.innerHTML = '<span></span><span></span><span></span>';
        chatContainer.appendChild(typingIndicator);
        scrollToBottom();

        const response = await window.threadManager.sendMainMessage(text);

        // Remove typing indicator
        typingIndicator.remove();

        // Display response
        addMessage(response.text, 'system');

        // Track AI message
        statsManager.trackMessage('ai', response.text);

        // TTS if enabled in template
        if (response.enableTTS) {
            const speechService = await getSpeechService();
            speechService.speak(response.text, prefs);
        }
    }

    async function checkForSavedSession() {
        // For now, we'll disable session resuming as it requires template restoration
        // TODO: Implement session restoration with template information
        const savedData = localStorage.getItem('contextura_conversation');
        if (savedData) {
            // Clear old session for now
            localStorage.removeItem('contextura_conversation');
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
    const hasSeenOnboarding = localStorage.getItem('contextura_has_seen_onboarding');

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
            localStorage.setItem('contextura_has_seen_onboarding', 'true');
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
    const hasDismissed = localStorage.getItem('contextura_pwa_dismissed');
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
        localStorage.setItem('contextura_pwa_dismissed', 'true');
    });

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
        console.log('PWA was installed');
        pwaBanner.classList.add('hidden');
        deferredPrompt = null;
    });
}

// Stats Dashboard Helper Functions
function updateStatsDashboard(summary) {
    // Update summary cards
    document.getElementById('total-sessions').textContent = summary.totalSessions;
    document.getElementById('total-time').textContent = formatDuration(summary.totalMinutes);
    document.getElementById('total-messages').textContent = summary.totalMessages;
    document.getElementById('current-streak').textContent = summary.currentStreak;

    // Update progress items
    document.getElementById('unique-vocab-count').textContent = `${summary.uniqueVocabCount} words`;
    document.getElementById('longest-streak').textContent = `${summary.longestStreak} days`;

    const grammarList = summary.grammarPracticed.length > 0
        ? summary.grammarPracticed.join(', ')
        : 'None yet';
    document.getElementById('grammar-practiced').textContent = grammarList;

    const difficultyList = summary.difficultiesUsed.length > 0
        ? summary.difficultiesUsed.join(', ')
        : '—';
    document.getElementById('difficulties-used').textContent = difficultyList;

    // Render chart
    renderActivityChart(summary.last7Days);
}

function renderActivityChart(daysData) {
    const chartContainer = document.getElementById('activity-chart');
    chartContainer.innerHTML = '';

    // Find max minutes for scaling
    const maxMinutes = Math.max(...daysData.map(d => d.minutes), 10); // Min 10 mins for scale

    daysData.forEach(day => {
        const column = document.createElement('div');
        column.className = 'chart-column';

        // Calculate height percentage (max 100%)
        const heightPercent = Math.min((day.minutes / maxMinutes) * 100, 100);

        // Create bar
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        bar.style.height = `${heightPercent}%`;

        // Tooltip data
        const tooltipText = `${day.minutes} min (${day.sessionCount} sessions)`;
        bar.setAttribute('data-tooltip', tooltipText);

        // Label (Day name)
        const label = document.createElement('div');
        label.className = 'chart-label';
        label.textContent = day.dayName;

        column.appendChild(bar);
        column.appendChild(label);
        chartContainer.appendChild(column);
    });
}

function formatDuration(minutes) {
    if (minutes < 60) {
        return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
}
