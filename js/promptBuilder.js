import { grammarTemplates, vocabularyTemplates, skillLevelTemplates, baseRole } from './templates.js';

export class SpanishTutorPromptBuilder {
    constructor(userPreferences) {
        this.preferences = userPreferences;
    }

    build() {
        let prompt = "";

        switch (this.preferences.mode) {
            case 'beginner':
                prompt = this.buildBeginnerPrompt();
                break;
            case 'intermediate':
                prompt = this.buildIntermediatePrompt();
                break;
            case 'advanced':
            default:
                prompt = this.buildAdvancedPrompt();
                break;
        }

        // Custom Instructions (Natural Language) - Moved to end for higher priority
        if (this.preferences.customInstructions) {
            prompt += "\nUSER CUSTOM REQUEST (PRIORITY):\n";
            prompt += `The user specifically asked: "${this.preferences.customInstructions}".\nADAPT YOUR CONVERSATION TO FULFILL THIS REQUEST ABOVE ALL ELSE.\n`;
        }

        return prompt;
    }

    buildBeginnerPrompt() {
        let prompt = "ROLE: You are a patient, encouraging Spanish tutor for a complete beginner.\n\n";
        prompt += "GOAL: Help the user practice specific vocabulary in a very simple, controlled environment.\n\n";

        prompt += "INSTRUCTIONS:\n";
        prompt += "1. Speak mostly in simple Spanish.\n";
        prompt += "2. Provide English subtitles for EVERYTHING you say, EXCEPT for the target vocabulary words listed below.\n";
        prompt += "3. Keep sentences very short and simple (Subject-Verb-Object).\n";
        prompt += "4. Guide the conversation to use the target vocabulary naturally.\n\n";

        if (this.preferences.targetVocabulary) {
            prompt += "TARGET VOCABULARY (Keep these in Spanish ONLY - NO translation):\n";
            prompt += `${this.preferences.targetVocabulary}\n\n`;
        }

        prompt += "EXAMPLE INTERACTION:\n";
        prompt += "User: Hola\n";
        prompt += "You: ¡Hola! ¿Cómo estás? [EN] Hello! How are you?\n";
        prompt += "User: Bien\n";
        prompt += "You: Me alegro. ¿Te gusta el *gato*? [EN] I'm glad. Do you like the *gato*?\n";
        prompt += "(Note: 'gato' was a target word, so it remained in Spanish while the rest was translated)\n";

        return prompt;
    }

    buildIntermediatePrompt() {
        let prompt = "ROLE: You are a helpful Spanish tutor focusing on grammar practice.\n\n";
        prompt += "GOAL: Help the user practice specific grammar tenses/moods.\n\n";

        prompt += "INSTRUCTIONS:\n";
        prompt += "1. Speak naturally but focus your questions to elicit the target grammar.\n";
        prompt += "2. If the user makes a grammar mistake in the target tense, gently correct them.\n";
        prompt += "3. Avoid complex grammar that is not in the focus list if possible.\n\n";

        if (this.preferences.selectedGrammar && this.preferences.selectedGrammar.length > 0) {
            prompt += "GRAMMAR FOCUS (Prioritize these):\n";
            this.preferences.selectedGrammar.forEach(g => prompt += `- ${g}\n`);
            prompt += "\n";
        }

        return prompt;
    }

    buildAdvancedPrompt() {
        let prompt = baseRole + "\n\n";

        // Skill Level
        const skill = skillLevelTemplates[this.preferences.skillLevel] || skillLevelTemplates.advanced;
        prompt += `SKILL LEVEL: Advanced/Natural\n`;
        prompt += `- Language: ${skill.language}\n`;
        prompt += `- Feedback: ${skill.feedback}\n`;
        prompt += `- Complexity: ${skill.complexity}\n\n`;

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
