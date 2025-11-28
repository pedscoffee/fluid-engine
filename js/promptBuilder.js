import { grammarTemplates, vocabularyTemplates, skillLevelTemplates, baseRole } from './templates.js';

export class SpanishTutorPromptBuilder {
    constructor(userPreferences) {
        this.preferences = userPreferences;
    }

    build() {
        let prompt = baseRole + "\n\n";

        // Skill Level
        const skill = skillLevelTemplates[this.preferences.skillLevel] || skillLevelTemplates.intermediate;
        prompt += `SKILL LEVEL (${this.preferences.skillLevel}):\n`;
        prompt += `- Language: ${skill.language}\n`;
        prompt += `- Feedback: ${skill.feedback}\n`;
        prompt += `- Complexity: ${skill.complexity}\n\n`;

        // Grammar Focus
        if (this.preferences.grammarFocus && this.preferences.grammarFocus.length > 0) {
            prompt += "GRAMMAR FOCUS:\n";
            this.preferences.grammarFocus.forEach(focus => {
                if (grammarTemplates[focus]) {
                    prompt += `- ${grammarTemplates[focus]}\n`;
                }
            });
            prompt += "\n";
        }

        // Vocabulary Focus
        if (this.preferences.vocabularyFocus && this.preferences.vocabularyFocus.length > 0) {
            prompt += "VOCABULARY FOCUS:\n";
            this.preferences.vocabularyFocus.forEach(focus => {
                if (vocabularyTemplates[focus]) {
                    prompt += `- ${vocabularyTemplates[focus]}\n`;
                }
            });
            prompt += "\n";
        }

        // Custom Instructions (Natural Language)
        if (this.preferences.customInstructions) {
            prompt += "USER CUSTOM REQUEST:\n";
            prompt += `The user specifically asked: "${this.preferences.customInstructions}". Adapt the conversation to fulfill this request.\n\n`;
        }

        // General Rules
        prompt += "IMPORTANT RULES:\n";
        prompt += "1. Speak ONLY in Spanish, unless the user is completely stuck and needs an explanation in English.\n";
        prompt += "2. Keep responses concise (1-3 sentences) to encourage a back-and-forth dialogue.\n";
        prompt += "3. Correct mistakes gently by repeating the sentence correctly in your response, or providing a subtle tip.\n";

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
