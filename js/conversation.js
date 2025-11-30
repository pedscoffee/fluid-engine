import * as webllm from "@mlc-ai/web-llm";
import { config } from './config.js';
import { SpanishTutorPromptBuilder } from './promptBuilder.js';
import { saveToStorageAsync, loadFromStorage, removeFromStorageAsync } from './asyncStorage.js';

export class ConversationManager {
    constructor() {
        this.engine = null;
        this.messages = [];
        this.systemPrompt = "";
        this.isInitialized = false;
        this.storageKey = 'soltura_conversation';
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

        // Translation is now handled by a separate pass, so no system prompt rule needed.

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

            return {
                spanish: reply,
                english: null // Will be populated if translation is requested
            };
        } catch (error) {
            console.error("Generation error:", error);
            // Remove the user message if generation failed
            this.messages.pop();
            throw new Error("Failed to generate response. Please try again.");
        }
    }

    async translateText(text) {
        if (!this.isInitialized) return null;

        try {
            // Create a temporary separate chat for translation to avoid polluting the main context
            // or just use a simple completion if the API supports it. 
            // We'll use a fresh messages array for this task.
            const translationMessages = [
                { role: "system", content: "You are a professional translator. Translate the following Spanish text to English. Output ONLY the English translation, nothing else." },
                { role: "user", content: text }
            ];

            const completion = await this.engine.chat.completions.create({
                messages: translationMessages,
                temperature: 0.3, // Lower temperature for accurate translation
                max_tokens: 256,
            });

            return completion.choices[0].message.content.trim();
        } catch (error) {
            console.error("Translation error:", error);
            return null;
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

    async saveToStorage() {
        const data = {
            messages: this.messages,
            systemPrompt: this.systemPrompt,
            timestamp: Date.now()
        };
        await saveToStorageAsync(this.storageKey, data);
    }

    loadFromStorage() {
        const data = loadFromStorage(this.storageKey);
        if (data) {
            // Only load if less than 24 hours old
            const age = Date.now() - data.timestamp;
            if (age < 24 * 60 * 60 * 1000) {
                return data;
            }
        }
        return null;
    }

    async clearStorage() {
        await removeFromStorageAsync(this.storageKey);
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
