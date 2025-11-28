import { UserPreferences } from './preferences.js';
import { SpanishTutorPromptBuilder } from './promptBuilder.js';
import { getConversationManager } from './conversation.js';
import { getSpeechService } from './speech.js';

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

    // Initialize inputs with saved prefs
    if (prefs.skillLevel) {
        const el = document.querySelector(`input[name="skill-level"][value="${prefs.skillLevel}"]`);
        if (el) el.checked = true;
    }

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
            await speechService.speak(greeting);

            // 6. Switch Screens
            loadingOverlay.classList.add('hidden');
            setupScreen.classList.remove('active');
            setupScreen.classList.add('hidden');
            conversationScreen.classList.remove('hidden');
            conversationScreen.classList.add('active');

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
            await speechService.speak(response);
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

    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    async function handleUserMessage(text) {
        addMessage(text, 'user');

        // Show typing indicator?

        const conversationManager = await getConversationManager();
        const response = await conversationManager.generateResponse(text);

        addMessage(response, 'system');

        const speechService = await getSpeechService();
        await speechService.speak(response);
    }
}
