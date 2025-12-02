import { saveToStorageAsync, loadFromStorage } from './asyncStorage.js';

/**
 * StatsManager - Tracks and manages user progress statistics
 * 
 * Collects data on:
 * - Session metrics (duration, message count, dates)
 * - Learning progress (vocabulary, grammar, difficulty levels)
 * - Practice habits (streaks, frequency)
 * - Anki integration (words used in conversation)
 */

export class StatsManager {
    constructor() {
        this.storageKey = 'soltura_stats_sessions';
        this.sessions = this.loadSessions();
        this.currentSession = null;
    }

    // Load all sessions from storage
    loadSessions() {
        const data = loadFromStorage(this.storageKey);
        return data ? data.sessions || [] : [];
    }

    // Save sessions to storage
    async saveSessions() {
        await saveToStorageAsync(this.storageKey, {
            sessions: this.sessions,
            lastUpdated: Date.now()
        });
    }

    // Start tracking a new session
    startSession(preferences) {
        this.currentSession = {
            sessionId: this.generateId(),
            date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
            startTime: Date.now(),
            endTime: null,
            duration: 0, // seconds
            messageCount: 0,
            userMessageCount: 0,
            aiMessageCount: 0,
            difficulty: preferences.difficultyLevel || 'Auto',
            vocabulary: new Set(), // Unique words used
            grammarFocuses: preferences.selectedGrammar || [],
            customGoal: preferences.customInstructions || '',
            ankiWordsUsed: new Set()
        };

        console.log('Stats: Session started', this.currentSession.sessionId);
    }

    // Track a message in the current session
    trackMessage(sender, message) {
        if (!this.currentSession) return;

        this.currentSession.messageCount++;

        if (sender === 'user') {
            this.currentSession.userMessageCount++;
            // Extract vocabulary from user's Spanish
            this.extractVocabulary(message);
        } else {
            this.currentSession.aiMessageCount++;
        }
    }

    // Extract Spanish words from message (simple tokenization)
    extractVocabulary(text) {
        if (!this.currentSession) return;

        // Common Spanish stop words to ignore
        const stopWords = new Set([
            'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
            'de', 'del', 'al', 'y', 'o', 'pero', 'que', 'en', 'a',
            'por', 'para', 'con', 'sin', 'sobre', 'entre', 'hasta',
            'es', 'está', 'son', 'están', 'ser', 'estar', 'hay',
            'sí', 'no', 'yo', 'tú', 'él', 'ella', 'nosotros', 'vosotros', 'ellos', 'ellas',
            'mi', 'tu', 'su', 'nuestro', 'vuestro', 'me', 'te', 'se', 'nos', 'os', 'le', 'lo', 'la'
        ]);

        // Tokenize and clean
        const words = text.toLowerCase()
            .replace(/[¿?¡!.,;:]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopWords.has(word));

        words.forEach(word => {
            this.currentSession.vocabulary.add(word);
        });
    }

    // End the current session and save
    async endSession() {
        if (!this.currentSession) return;

        this.currentSession.endTime = Date.now();
        this.currentSession.duration = Math.floor(
            (this.currentSession.endTime - this.currentSession.startTime) / 1000
        );

        // Convert Sets to Arrays for storage
        const sessionToSave = {
            ...this.currentSession,
            vocabulary: Array.from(this.currentSession.vocabulary),
            ankiWordsUsed: Array.from(this.currentSession.ankiWordsUsed)
        };

        this.sessions.push(sessionToSave);
        await this.saveSessions();

        console.log('Stats: Session ended', sessionToSave.sessionId, `${sessionToSave.duration}s`);

        this.currentSession = null;
    }

    // Check if a session is currently active
    isSessionActive() {
        return this.currentSession !== null;
    }

    // Get aggregated statistics summary for dashboard
    getStatsSummary() {
        const summary = {
            totalSessions: this.sessions.length,
            totalMessages: 0,
            totalUserMessages: 0,
            totalAiMessages: 0,
            totalMinutes: 0,
            uniqueVocabCount: 0,
            currentStreak: 0,
            longestStreak: 0,
            last7Days: [],
            grammarPracticed: new Set(),
            difficultiesUsed: new Set(),
            allVocabulary: new Set()
        };

        if (this.sessions.length === 0) {
            return summary;
        }

        // Aggregate totals
        this.sessions.forEach(session => {
            summary.totalMessages += session.messageCount;
            summary.totalUserMessages += session.userMessageCount;
            summary.totalAiMessages += session.aiMessageCount;
            summary.totalMinutes += Math.floor(session.duration / 60);

            // Collect unique vocabulary
            if (session.vocabulary) {
                session.vocabulary.forEach(word => summary.allVocabulary.add(word));
            }

            // Collect grammar focuses
            if (session.grammarFocuses) {
                session.grammarFocuses.forEach(g => summary.grammarPracticed.add(g));
            }

            // Collect difficulty levels
            summary.difficultiesUsed.add(session.difficulty);
        });

        summary.uniqueVocabCount = summary.allVocabulary.size;

        // Calculate streaks
        const streaks = this.calculateStreaks();
        summary.currentStreak = streaks.current;
        summary.longestStreak = streaks.longest;

        // Get last 7 days activity
        summary.last7Days = this.getLast7DaysActivity();

        // Convert Sets to Arrays for display
        summary.grammarPracticed = Array.from(summary.grammarPracticed);
        summary.difficultiesUsed = Array.from(summary.difficultiesUsed);

        return summary;
    }

    // Calculate current and longest practice streaks
    calculateStreaks() {
        if (this.sessions.length === 0) {
            return { current: 0, longest: 0 };
        }

        // Get unique dates, sorted
        const dates = [...new Set(this.sessions.map(s => s.date))].sort();

        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 1;

        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        // Check if there's activity today or yesterday for current streak
        const hasRecentActivity = dates.includes(today) || dates.includes(yesterday);

        if (hasRecentActivity) {
            currentStreak = 1;

            // Count backwards from most recent date
            for (let i = dates.length - 2; i >= 0; i--) {
                const current = new Date(dates[i + 1]);
                const previous = new Date(dates[i]);
                const diffDays = Math.floor((current - previous) / 86400000);

                if (diffDays === 1) {
                    currentStreak++;
                } else {
                    break;
                }
            }
        }

        // Calculate longest streak
        for (let i = 1; i < dates.length; i++) {
            const current = new Date(dates[i]);
            const previous = new Date(dates[i - 1]);
            const diffDays = Math.floor((current - previous) / 86400000);

            if (diffDays === 1) {
                tempStreak++;
                longestStreak = Math.max(longestStreak, tempStreak);
            } else {
                tempStreak = 1;
            }
        }

        longestStreak = Math.max(longestStreak, currentStreak, 1);

        return { current: currentStreak, longest: longestStreak };
    }

    // Get activity for the last 7 days
    getLast7DaysActivity() {
        const last7Days = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const sessionsOnDay = this.sessions.filter(s => s.date === dateStr);
            const totalMinutes = sessionsOnDay.reduce((sum, s) => sum + Math.floor(s.duration / 60), 0);

            last7Days.push({
                date: dateStr,
                dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
                sessionCount: sessionsOnDay.length,
                minutes: totalMinutes,
                messages: sessionsOnDay.reduce((sum, s) => sum + s.messageCount, 0)
            });
        }

        return last7Days;
    }

    // Export all stats as JSON
    exportData() {
        const data = {
            exportDate: new Date().toISOString(),
            summary: this.getStatsSummary(),
            sessions: this.sessions
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `soltura-stats-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Clear all statistics
    async clearAllStats() {
        this.sessions = [];
        this.currentSession = null;
        await this.saveSessions();
        console.log('Stats: All statistics cleared');
    }

    // Generate unique session ID
    generateId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Singleton instance
let statsManager = null;

export function initStatsManager() {
    if (!statsManager) {
        statsManager = new StatsManager();
    }
    return statsManager;
}

export function getStatsManager() {
    return statsManager;
}
