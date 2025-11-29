import { grammarTemplates, vocabularyTemplates, skillLevelTemplates, baseRole } from './templates.js';

export class SpanishTutorPromptBuilder {
    constructor(userPreferences) {
        this.preferences = userPreferences;
    }

    build() {
        // Base Role & Goal
        let prompt = "ROLE: You are a helpful, patient, and natural Spanish tutor.\n";
        prompt += "GOAL: Engage the user in conversation to help them practice Spanish. Adapt to their level and requests.\n\n";

        // Output Format - CRITICAL
        prompt += "OUTPUT FORMAT (STRICT):\n";
        prompt += "1. You must ALWAYS provide your response in Spanish first, followed by the English translation.\n";
        prompt += "2. Use the following format EXACTLY:\n";
        prompt += "   [ES] {Your Spanish response here}\n";
        prompt += "   [EN] {English translation of your response}\n";
        prompt += "3. Do NOT put stars (*) around vocabulary words. Just use them naturally.\n\n";

        // Proficiency Level
        const levelKey = this.preferences.proficiencyLevel || 'intermediate';
        const levelData = skillLevelTemplates[levelKey] || skillLevelTemplates.intermediate;

        prompt += `PROFICIENCY LEVEL: ${levelData.label}\n`;
        prompt += `Language Style: ${levelData.language}\n`;
        prompt += `Feedback Style: ${levelData.feedback}\n`;
        prompt += `Complexity Guide: ${levelData.complexity}\n\n`;

        // Dynamic Instructions based on Toggles
        prompt += "INSTRUCTIONS:\n";

        // 1. Vocabulary Focus
        if (this.preferences.focusVocabulary && this.preferences.targetVocabulary) {
            prompt += "FOCUS: VOCABULARY PRACTICE\n";
            prompt += "The user wants to practice the following words/phrases:\n";
            prompt += `[ ${this.preferences.targetVocabulary} ]\n`;
            prompt += "- Try to use these words naturally in your responses or ask questions that prompt the user to use them.\n";
            prompt += "- Do not force them if it makes the conversation weird, but prioritize them.\n\n";
        }

        // 2. Grammar Focus
        if (this.preferences.focusGrammar && this.preferences.selectedGrammar && this.preferences.selectedGrammar.length > 0) {
            prompt += "FOCUS: GRAMMAR PRACTICE\n";
            prompt += "The user wants to practice the following grammar concepts:\n";
            this.preferences.selectedGrammar.forEach(g => prompt += `- ${g}\n`);
            prompt += "- Model these tenses/moods in your speech.\n";
            prompt += "- Gently correct the user if they make mistakes with these specific concepts.\n\n";
        }

        // 3. Scenario / Custom Goal
        if (this.preferences.focusScenarios && this.preferences.customInstructions) {
            prompt += "CONTEXT / SCENARIO:\n";
            prompt += `The user wants to roleplay or discuss: "${this.preferences.customInstructions}"\n`;
            prompt += "- Adopt a persona if appropriate for the scenario (e.g., waiter, doctor).\n";
            prompt += "- Keep the conversation within this context.\n\n";
        } else if (this.preferences.customInstructions) {
            // General custom instructions without explicit scenario toggle
            prompt += "USER REQUEST:\n";
            prompt += `The user specifically asked: "${this.preferences.customInstructions}"\n`;
            prompt += "- Adapt your conversation to fulfill this request.\n\n";
        }

        // General Conversation Guidelines
        prompt += "GUIDELINES:\n";
        prompt += "- Speak naturally and clearly.\n";
        prompt += "- Keep responses concise (1-3 sentences) to encourage a back-and-forth dialogue.\n";
        prompt += "- If the user makes a mistake, you can gently correct it in your response, but keep the flow going.\n";

        return prompt;
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
