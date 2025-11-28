import * as webllm from "@mlc-ai/web-llm";
import { config } from './config.js';
import { SpanishTutorPromptBuilder } from './promptBuilder.js';

export class ConversationManager {
    constructor() {
        this.engine = null;
        this.messages = [];
        this.systemPrompt = "";
        this.isInitialized = false;
    }

    async init(progressCallback) {
        if (this.isInitialized) return;

        try {
            this.engine = new webllm.MLCEngine();
            this.engine.setInitProgressCallback((report) => {
                if (progressCallback) {
                    progressCallback(report);
                }
            });

            await this.engine.reload(config.modelId);
            this.isInitialized = true;
            console.log("WebLLM initialized");
        } catch (error) {
            console.error("Failed to initialize WebLLM:", error);
            throw error;
        }
    }

    startConversation(userPreferences) {
        // Build system prompt based on preferences
        const builder = new SpanishTutorPromptBuilder(userPreferences);
        this.systemPrompt = builder.build();

        this.messages = [
            { role: "system", content: this.systemPrompt }
        ];

        // Note: We don't pre-fill an assistant message here because we want the user to start 
        // OR we can have the AI start. Let's have the AI start for a better experience.
        // But to save inference time on load, we might just hardcode the first greeting in UI 
        // and only send user input to LLM.
        // Actually, let's let the LLM generate the greeting based on the context!
        // It makes it more dynamic.
    }

    async generateResponse(userMessage) {
        if (!this.isInitialized) {
            throw new Error("Engine not initialized");
        }

        // Add user message
        this.messages.push({ role: "user", content: userMessage });

        try {
            const completion = await this.engine.chat.completions.create({
                messages: this.messages,
                temperature: 0.7,
                max_tokens: 256, // Keep responses concise
            });

            const reply = completion.choices[0].message.content;
            this.messages.push({ role: "assistant", content: reply });

            return reply;
        } catch (error) {
            console.error("Generation error:", error);
            return "Lo siento, tuve un problema al pensar mi respuesta. ¿Puedes repetir?";
        }
    }

    async injectSystemInstruction(instruction) {
        // Add a system message in the middle of conversation
        // This is supported by some models, but usually it's better to just add a user message 
        // that acts like a system instruction or just append to history.
        // Llama 3 supports system messages, but putting them in the middle might be weird for the chat template.
        // Strategy: Add a system message to the history.
        this.messages.push({ role: "system", content: `[INSTRUCTION UPDATE]: ${instruction}` });
    }

    getHistory() {
        return this.messages;
    }
}

// Singleton
let conversationManager = null;

export async function initConversation() {
    if (!conversationManager) {
        conversationManager = new ConversationManager();
    }
    return conversationManager;
}

export function getConversationManager() {
    return conversationManager;
}
