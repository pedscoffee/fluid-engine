// js/dualThreadManager.js

import * as webllm from "@mlc-ai/web-llm";
import { config } from './config.js';
import { saveToStorageAsync, loadFromStorage } from './asyncStorage.js';

export class DualThreadManager {
  constructor(template) {
    this.template = template;
    this.engine = null;
    this.isInitialized = false;

    // Separate message histories
    this.mainMessages = [];
    this.sideMessages = [];

    this.storageKey = 'contextura_conversation';
  }

  async init(progressCallback) {
    if (this.isInitialized) return;

    this.engine = new webllm.MLCEngine();
    if (progressCallback) {
      this.engine.setInitProgressCallback(progressCallback);
    }

    await this.engine.reload(config.modelId);
    this.isInitialized = true;

    // Initialize with system prompts
    this.mainMessages = [
      { role: 'system', content: this.template.main.systemPrompt }
    ];
    this.sideMessages = [
      { role: 'system', content: this.template.side.systemPrompt }
    ];

    console.log('DualThreadManager initialized');
  }

  // Main thread message
  async sendMainMessage(userMessage) {
    if (!this.isInitialized) {
      throw new Error('Not initialized');
    }

    this.mainMessages.push({ role: 'user', content: userMessage });

    const completion = await this.engine.chat.completions.create({
      messages: this.mainMessages,
      temperature: this.template.main.temperature,
      max_tokens: this.template.main.maxTokens
    });

    const reply = completion.choices[0].message.content;
    this.mainMessages.push({ role: 'assistant', content: reply });

    await this.saveToStorage();

    return {
      text: reply,
      enableTTS: this.template.main.enableTTS
    };
  }

  // Side thread message with context injection
  async sendSideMessage(userMessage) {
    if (!this.isInitialized) {
      throw new Error('Not initialized');
    }

    // Build context-aware messages for side thread
    const contextMessages = this.buildSideContext();
    const messagesWithContext = [
      ...contextMessages,
      { role: 'user', content: userMessage }
    ];

    const completion = await this.engine.chat.completions.create({
      messages: messagesWithContext,
      temperature: this.template.side.temperature,
      max_tokens: this.template.side.maxTokens
    });

    const reply = completion.choices[0].message.content;

    // Store in side history
    this.sideMessages.push({ role: 'user', content: userMessage });
    this.sideMessages.push({ role: 'assistant', content: reply });

    await this.saveToStorage();

    return reply;
  }

  // Build context from main thread for side thread
  buildSideContext() {
    const mode = this.template.side.contextMode;
    const baseMessages = [this.sideMessages[0]]; // System prompt

    if (mode === 'full') {
      // Include all main conversation (excluding system prompt)
      const mainContext = this.mainMessages.slice(1).map(m => ({
        role: m.role,
        content: `[MAIN THREAD] ${m.content}`
      }));
      return [...baseMessages, ...mainContext, ...this.sideMessages.slice(1)];
    } else if (mode === 'last-n') {
      // Include last N messages from main
      const n = this.template.side.contextWindow;
      const recentMain = this.mainMessages.slice(-n).map(m => ({
        role: m.role,
        content: `[MAIN THREAD] ${m.content}`
      }));
      return [...baseMessages, ...recentMain, ...this.sideMessages.slice(1)];
    } else {
      // Manual mode - just side messages (user selects context manually)
      return this.sideMessages;
    }
  }

  // Auto-commentary trigger (optional feature)
  async generateAutoCommentary() {
    if (this.mainMessages.length < 3) return null; // Need some conversation first

    const lastExchange = this.mainMessages.slice(-2);
    const prompt = `Based on this recent exchange, provide helpful commentary:\n\nUser: ${lastExchange[0].content}\nAssistant: ${lastExchange[1].content}`;

    return await this.sendSideMessage(prompt);
  }

  getMainHistory() {
    return this.mainMessages;
  }

  getSideHistory() {
    return this.sideMessages;
  }

  getSystemPrompt() {
    return this.template.main.systemPrompt;
  }

  reset() {
    this.mainMessages = [
      { role: 'system', content: this.template.main.systemPrompt }
    ];
    this.sideMessages = [
      { role: 'system', content: this.template.side.systemPrompt }
    ];
    this.clearStorage();
  }

  async saveToStorage() {
    const data = {
      templateId: this.template.id,
      mainMessages: this.mainMessages,
      sideMessages: this.sideMessages,
      timestamp: Date.now()
    };
    await saveToStorageAsync(this.storageKey, data);
  }

  loadFromStorage() {
    return loadFromStorage(this.storageKey);
  }

  clearStorage() {
    localStorage.removeItem(this.storageKey);
  }
}
