import { grammarTemplates, vocabularyTemplates, difficultyLevels, baseRole } from './templates.js';

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

        // 2. Target Vocabulary (Optional)
        if (this.preferences.targetVocabulary) {
            prompt += "TARGET VOCABULARY:\n";
            prompt += `Try to naturally include the following words/phrases in your responses: ${this.preferences.targetVocabulary}\n\n`;
        }

        // 3. Grammar Focus (Optional)
        if (this.preferences.selectedGrammar && this.preferences.selectedGrammar.length > 0) {
            prompt += "GRAMMAR FOCUS:\n";
            prompt += "Prioritize using or eliciting the following grammar concepts:\n";
            this.preferences.selectedGrammar.forEach(g => prompt += `- ${g}\n`);
            prompt += "\n";
        }

        // 4. Custom Instructions / Scenarios (Optional - High Priority)
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
