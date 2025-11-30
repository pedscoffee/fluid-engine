import * as webllm from "@mlc-ai/web-llm";

export class TutorManager {
    constructor(conversationManager) {
        this.conversationManager = conversationManager;
        this.tutorMessages = [];
        this.currentInstruction = "Translate the student's message to English. Output ONLY the translation.";
        this.isInitialized = false;
    }

    async init() {
        // Use the same LLM engine from conversationManager
        this.isInitialized = true;
        console.log("TutorManager initialized");
    }

    setInstruction(instruction) {
        // Update the tutor's ongoing focus
        this.currentInstruction = instruction;
        console.log("Tutor instruction set to:", instruction);
    }

    async provideFeedback(message, targetType = 'user') {
        // Called after each main conversation message
        // Generates tutor response based on current instruction
        if (!this.isInitialized || !this.conversationManager.engine) {
            console.error("Tutor not initialized");
            return null;
        }

        try {
            let systemPrompt;

            // Check if strict translation is requested to avoid chatty preamble
            if (this.currentInstruction.includes("Output ONLY the translation")) {
                const contextIntro = targetType === 'ai'
                    ? "The student received this message:"
                    : "The student wrote this message:";

                systemPrompt = `You are a precise translator. ${this.currentInstruction}
                
${contextIntro} "${message}"`;
            } else {
                const contextIntro = targetType === 'ai'
                    ? "The student just received this Spanish message:"
                    : "The student wrote this message:";

                systemPrompt = `You are a helpful Spanish language tutor. ${this.currentInstruction}

${contextIntro} "${message}"

Provide helpful feedback based on your instructions. Be concise and encouraging.`;
            }

            const tutorResponse = await this._generateTutorResponse(systemPrompt, message);

            this.tutorMessages.push({
                role: 'tutor',
                content: tutorResponse,
                context: message,
                timestamp: Date.now()
            });

            return tutorResponse;
        } catch (error) {
            console.error("Tutor feedback error:", error);
            return null;
        }
    }

    async answerQuestion(userQuestion) {
        // Handle conversational Q&A with tutor
        if (!this.isInitialized || !this.conversationManager.engine) {
            console.error("Tutor not initialized");
            return null;
        }

        try {
            const context = this._getRecentContext();
            const systemPrompt = `You are a helpful Spanish language tutor. Answer the student's question about their Spanish practice session.

Recent conversation context:
${context}

Student's question: "${userQuestion}"

Provide a clear, helpful answer. Reference the conversation context when relevant.`;

            const answer = await this._generateTutorResponse(systemPrompt, userQuestion);

            this.tutorMessages.push({
                role: 'user',
                content: userQuestion,
                timestamp: Date.now()
            });
            this.tutorMessages.push({
                role: 'tutor',
                content: answer,
                timestamp: Date.now()
            });

            return answer;
        } catch (error) {
            console.error("Tutor answer error:", error);
            return null;
        }
    }

    async _generateTutorResponse(systemPrompt, userInput) {
        // Use conversation manager's engine for tutor responses
        const engine = this.conversationManager.engine;

        const messages = [
            { role: "system", content: systemPrompt },
            { role: "user", content: userInput }
        ];

        const completion = await engine.chat.completions.create({
            messages: messages,
            temperature: 0.7,
            max_tokens: 200,
        });

        return completion.choices[0].message.content.trim();
    }

    _getRecentContext() {
        // Get last few messages from main conversation for context
        const mainHistory = this.conversationManager.getHistory();
        return mainHistory.slice(-6).map(m => {
            const role = m.role === 'assistant' ? 'AI' : m.role;
            return `${role}: ${m.content}`;
        }).join('\n');
    }

    getTutorHistory() {
        return this.tutorMessages;
    }

    reset() {
        this.tutorMessages = [];
        this.currentInstruction = "Translate the student's message to English. Output ONLY the translation.";
    }
}

// Singleton
let tutorManager = null;

export async function initTutor(conversationManager) {
    if (!tutorManager) {
        tutorManager = new TutorManager(conversationManager);
        await tutorManager.init();
    }
    return tutorManager;
}

export function getTutorManager() {
    return tutorManager;
}
