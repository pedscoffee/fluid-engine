export class UserPreferences {
    constructor() {
        this.storageKey = 'fluidez_preferences';
        this.preferences = this.load();
    }

    load() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            return JSON.parse(stored);
        }
        return {
            // Core settings
            skillLevel: 'intermediate', // kept for potential future use or internal logic

            // Focus Toggles
            focusVocabulary: false,
            focusGrammar: false,
            focusScenarios: false,

            // Focus Data
            targetVocabulary: '',
            selectedGrammar: [],
            customInstructions: '', // For scenarios or custom goals

            // UI/UX Settings
            showTranslation: true, // Now controls side panel visibility mostly
            showSidePanel: true,
            muted: false,
            selectedVoice: ''
        };
    }

    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.preferences));
    }

    update(newPrefs) {
        this.preferences = { ...this.preferences, ...newPrefs };
        this.save();
    }

    get() {
        return this.preferences;
    }

    reset() {
        localStorage.removeItem(this.storageKey);
        this.preferences = this.load();
    }
}
