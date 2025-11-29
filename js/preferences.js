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
            skillLevel: 'intermediate',
            grammarFocus: [],
            vocabularyFocus: [],
            customInstructions: '',
            conversationStyle: 'natural',
            showTranslation: false,
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
