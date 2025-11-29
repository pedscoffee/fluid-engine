import * as webllm from "@mlc-ai/web-llm";
import { config } from './config.js';
import { SpanishTutorPromptBuilder } from './promptBuilder.js';

export class ConversationManager {
    constructor() {
        this.engine = null;
        this.messages = [];
        this.systemPrompt = "";
        this.isInitialized = false;
        this.storageKey = 'fluidez_conversation';
    }

    async init(progressCallback) {
        if (this.isInitialized) return;

        const maxTries = 3;
        let lastError = null;

        for (let attempt = 1; attempt <= maxTries; attempt++) {
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
                return;
            } catch (error) {
                lastError = error;
                console.error(`Initialization attempt ${attempt} failed:`, error);

                if (attempt < maxTries) {
                    const delay = attempt * 2000; // Progressive backoff
                    console.log(`Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    throw new Error(`Failed to initialize AI model after ${maxTries} attempts: ${lastError.message}`);
                }
            }
        }
    }

    startConversation(userPreferences) {
        // Build system prompt based on preferences
        const builder = new SpanishTutorPromptBuilder(userPreferences);
        this.systemPrompt = builder.build();

        // If translation is enabled, add translation instructions
        if (userPreferences.showTranslation) {
            this.systemPrompt += "\n\nIMPORTANT: After each Spanish response, provide an English translation on a new line starting with '[EN]'. Format: Your Spanish response\n[EN] English translation";
        }

        this.messages = [
            { role: "system", content: this.systemPrompt }
        ];
    }

    async generateResponse(userMessage) {
        if (!this.isInitialized) {
            throw new Error("AI model not initialized. Please reload the page.");
        }

        this.messages.push({ role: "user", content: userMessage });

        try {
            const completion = await this.engine.chat.completions.create({
                messages: this.messages,
                temperature: 0.7,
                max_tokens: 256,
            });

            const reply = completion.choices[0].message.content;
            this.messages.push({ role: "assistant", content: reply });

            return reply;
        } catch (error) {
            console.error("Generation error:", error);
            // Remove the user message if generation failed
            this.messages.pop();
            throw new Error("Failed to generate response. Please try again.");
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

    reset() {
        this.messages = [];
        this.systemPrompt = "";
        this.clearStorage();
    }

    saveToStorage() {
        const data = {
            messages: this.messages,
            systemPrompt: this.systemPrompt,
            timestamp: Date.now()
        };
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    loadFromStorage() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            try {
                const data = JSON.parse(stored);
                // Only load if less than 24 hours old
                const age = Date.now() - data.timestamp;
                if (age < 24 * 60 * 60 * 1000) {
                    return data;
                }
            } catch (e) {
                console.error('Failed to load conversation:', e);
            }
        }
        return null;
    }

    clearStorage() {
        localStorage.removeItem(this.storageKey);
    }

    restoreFromData(data) {
        this.messages = data.messages;
        this.systemPrompt = data.systemPrompt;
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
