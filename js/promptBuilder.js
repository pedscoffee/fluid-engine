import { grammarTemplates, vocabularyTemplates, difficultyLevels, baseRole } from './templates.js';
import { ankiDataManager } from './ankiData.js';

export class SpanishTutorPromptBuilder {
    constructor(userPreferences) {
        this.preferences = userPreferences;
    }

    build() {
        let prompt = baseRole + "\n\n";

        // 1. Difficulty Level (Required)
        const level = this.preferences.difficultyLevel || 'B1';
        const levelDescription = difficultyLevels[level] || difficultyLevels['B1'];

        prompt += `CURRENT DIFFICULTY LEVEL: ${level}\n`;
        prompt += `${levelDescription}\n\n`;

        // 2. Anki Spaced Repetition Vocabulary Guidance (If available)
        const ankiGuidance = ankiDataManager.getVocabularyGuidance();
        if (ankiGuidance.totalWords > 0) {
            prompt += "ANKI VOCABULARY SCAFFOLDING:\n";
            prompt += "The user has imported their Anki deck data. Use this to create an optimal learning experience:\n\n";

            // Mastered words (use freely as scaffolding)
            if (ankiGuidance.mastered.length > 0) {
                const masteredSample = this.sampleWords(ankiGuidance.mastered, 30);
                prompt += `MASTERED WORDS (use freely - these are well-known to the user):\n`;
                prompt += `${masteredSample.join(', ')}\n`;
                if (ankiGuidance.mastered.length > 30) {
                    prompt += `...and ${ankiGuidance.mastered.length - 30} more mastered words\n`;
                }
                prompt += "\n";
            }

            // Familiar words (good for scaffolding)
            if (ankiGuidance.familiar.length > 0) {
                const familiarSample = this.sampleWords(ankiGuidance.familiar, 30);
                prompt += `FAMILIAR WORDS (comfortable for the user - use to support learning):\n`;
                prompt += `${familiarSample.join(', ')}\n`;
                if (ankiGuidance.familiar.length > 30) {
                    prompt += `...and ${ankiGuidance.familiar.length - 30} more familiar words\n`;
                }
                prompt += "\n";
            }

            // Learning words (current focus - use with support)
            if (ankiGuidance.learning.length > 0) {
                const learningSample = this.sampleWords(ankiGuidance.learning, 20);
                prompt += `CURRENTLY LEARNING (use these more frequently to reinforce):\n`;
                prompt += `${learningSample.join(', ')}\n`;
                if (ankiGuidance.learning.length > 20) {
                    prompt += `...and ${ankiGuidance.learning.length - 20} more learning words\n`;
                }
                prompt += "\n";
            }

            // New/struggling words (introduce carefully with context)
            if (ankiGuidance.new.length > 0) {
                const newSample = this.sampleWords(ankiGuidance.new, 15);
                prompt += `NEW/CHALLENGING WORDS (introduce carefully with familiar word support):\n`;
                prompt += `${newSample.join(', ')}\n`;
                if (ankiGuidance.new.length > 15) {
                    prompt += `...and ${ankiGuidance.new.length - 15} more new words\n`;
                }
                prompt += "\n";
            }

            prompt += "SCAFFOLDING STRATEGY:\n";
            prompt += "- Build sentences using MASTERED and FAMILIAR words as the foundation\n";
            prompt += "- Naturally incorporate LEARNING words to reinforce retention\n";
            prompt += "- Introduce NEW words in context with lots of familiar vocabulary support\n";
            prompt += "- Create connections between new words and words the user already knows well\n";
            prompt += "- This approach maximizes comprehension while gently expanding vocabulary\n\n";
        }

        // 3. Target Vocabulary (Optional)
        if (this.preferences.targetVocabulary) {
            prompt += "TARGET VOCABULARY:\n";
            prompt += `Try to naturally include the following words/phrases in your responses: ${this.preferences.targetVocabulary}\n\n`;
        }

        // 4. Grammar Focus (Optional)
        if (this.preferences.selectedGrammar && this.preferences.selectedGrammar.length > 0) {
            prompt += "GRAMMAR FOCUS:\n";
            prompt += "Prioritize using or eliciting the following grammar concepts:\n";
            this.preferences.selectedGrammar.forEach(g => prompt += `- ${g}\n`);
            prompt += "\n";
        }

        // 5. Custom Instructions / Scenarios (Optional - High Priority)
        if (this.preferences.customInstructions) {
            prompt += "USER CUSTOM REQUEST (PRIORITY):\n";
            prompt += `The user specifically asked: "${this.preferences.customInstructions}".\nADAPT YOUR CONVERSATION TO FULFILL THIS REQUEST ABOVE ALL ELSE.\n`;
        }

        // General Rules
        prompt += "IMPORTANT RULES:\n";
        prompt += "1. Speak ONLY in Spanish. No English unless requested.\n";
        prompt += "2. Keep responses concise (1-3 sentences) to encourage a back-and-forth dialogue.\n";
        prompt += "3. REFLECTIVE FEEDBACK: If the user makes a mistake, rephrase it correctly in your response naturally, or ask a clarifying question. Do not lecture.\n";

        return prompt;
    }

    /**
     * Helper method to sample random words from a list
     * @param {Array} words - Array of words to sample from
     * @param {number} count - Number of words to sample
     * @returns {Array} Sampled words
     */
    sampleWords(words, count) {
        if (words.length <= count) {
            return words;
        }

        // Shuffle and take first 'count' items
        const shuffled = [...words].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    static parseNaturalInstruction(instruction) {
        const result = {
            grammarFocus: [],
            vocabularyFocus: [],
            customInstructions: instruction // Always keep the raw instruction
        };

        if (!instruction) return result;

        const lower = instruction.toLowerCase();

        // Simple keyword matching
        // Grammar
        if (lower.includes('subjunctive')) result.grammarFocus.push('subjunctive');
        if (lower.includes('command')) result.grammarFocus.push('subjunctiveCommands');
        if (lower.includes('past') || lower.includes('preterite') || lower.includes('imperfect')) result.grammarFocus.push('pastTense');
        if (lower.includes('future')) result.grammarFocus.push('future');
        if (lower.includes('conditional') || lower.includes('would')) result.grammarFocus.push('conditional');
        if (lower.includes('por') && lower.includes('para')) result.grammarFocus.push('porVsPara');
        if (lower.includes('ser') && lower.includes('estar')) result.grammarFocus.push('serVsEstar');

        // Vocabulary
        if (lower.includes('restaurant') || lower.includes('food') || lower.includes('eat')) result.vocabularyFocus.push('restaurant');
        if (lower.includes('travel') || lower.includes('trip') || lower.includes('hotel')) result.vocabularyFocus.push('travel');
        if (lower.includes('shop') || lower.includes('buy')) result.vocabularyFocus.push('shopping');
        if (lower.includes('doctor') || lower.includes('sick') || lower.includes('medical')) result.vocabularyFocus.push('medical');
        if (lower.includes('business') || lower.includes('work') || lower.includes('job')) result.vocabularyFocus.push('business');
        if (lower.includes('family') || lower.includes('parent') || lower.includes('brother')) result.vocabularyFocus.push('family');
        if (lower.includes('hobby') || lower.includes('sport') || lower.includes('music')) result.vocabularyFocus.push('hobbies');

        return result;
    }
}
