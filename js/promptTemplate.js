// js/promptTemplate.js

export class PromptTemplate {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.name = data.name || 'Untitled Template';
    this.description = data.description || '';
    this.tags = data.tags || [];
    this.createdAt = data.createdAt || new Date().toISOString();

    // Main thread config
    this.main = {
      personaName: data.main?.personaName || 'Assistant',
      systemPrompt: data.main?.systemPrompt || 'You are a helpful assistant.',
      temperature: data.main?.temperature || 0.7,
      maxTokens: data.main?.maxTokens || 512,
      enableTTS: data.main?.enableTTS !== false
    };

    // Commentary/side thread config
    this.side = {
      personaName: data.side?.personaName || 'Helper',
      systemPrompt: data.side?.systemPrompt || 'You help clarify the main conversation.',
      temperature: data.side?.temperature || 0.7,
      maxTokens: data.side?.maxTokens || 256,
      contextMode: data.side?.contextMode || 'last-n', // 'last-n', 'full', 'manual'
      contextWindow: data.side?.contextWindow || 5 // number of messages to include
    };
  }

  generateId() {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  validate() {
    if (!this.name || this.name.trim() === '') {
      throw new Error('Template name is required');
    }
    if (!this.main.systemPrompt || this.main.systemPrompt.trim() === '') {
      throw new Error('Main system prompt is required');
    }
    return true;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      tags: this.tags,
      createdAt: this.createdAt,
      main: this.main,
      side: this.side
    };
  }

  static fromJSON(json) {
    return new PromptTemplate(json);
  }
}

// Template Manager
export class TemplateManager {
  constructor() {
    this.storageKey = 'contextura_templates';
    this.templates = this.loadTemplates();
  }

  loadTemplates() {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      return JSON.parse(stored).map(t => PromptTemplate.fromJSON(t));
    }
    return [];
  }

  async saveTemplates() {
    const json = this.templates.map(t => t.toJSON());
    localStorage.setItem(this.storageKey, JSON.stringify(json));
  }

  addTemplate(template) {
    template.validate();
    this.templates.push(template);
    this.saveTemplates();
    return template.id;
  }

  getTemplate(id) {
    return this.templates.find(t => t.id === id);
  }

  updateTemplate(id, updates) {
    const template = this.getTemplate(id);
    if (template) {
      Object.assign(template, updates);
      template.validate();
      this.saveTemplates();
    }
  }

  deleteTemplate(id) {
    this.templates = this.templates.filter(t => t.id !== id);
    this.saveTemplates();
  }

  getAllTemplates() {
    return this.templates;
  }

  exportTemplate(id) {
    const template = this.getTemplate(id);
    if (template) {
      const json = JSON.stringify(template.toJSON(), null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name.replace(/\s+/g, '-')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  importTemplate(jsonString) {
    const data = JSON.parse(jsonString);
    const template = PromptTemplate.fromJSON(data);
    template.id = template.generateId(); // New ID to avoid conflicts
    return this.addTemplate(template);
  }
}
