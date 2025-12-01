# Soltura - AI-Powered Conversational Spanish Practice

> **soltura** (sohl-too-rah) _(f)_ - fluency, ease

Practice Spanish naturally with an AI tutor that runs entirely in your browser. No server, no subscriptions, complete privacy.

![WebGPU](https://img.shields.io/badge/WebGPU-required-green.svg)
![Browser](https://img.shields.io/badge/browser-Chrome%20113%2B-orange.svg)

## ✨ Features

### 🔒 **100% Private & Local**
- All AI inference runs in your browser using WebGPU
- No data sent to servers
- Works completely offline (after initial model download)
- Your conversations never leave your device

### 🎯 **Adaptive Difficulty**
- **Auto Mode**: Dynamically analyzes your proficiency and adjusts in real-time
- **Manual Levels**: A1 (Beginner) → C2 (Proficient) → Native (unrestricted)
- Matches your grammar complexity, vocabulary, and fluency automatically

### 📚 **Anki Integration**
- Import your Anki decks (.apkg or .tsv files)
- AI uses **vocabulary scaffolding**: builds sentences with words you know well, gradually introduces new vocabulary
- Categorizes words by mastery level: Mastered → Familiar → Learning → New
- Smart sampling keeps prompts efficient (~45% token reduction)

### 🎙️ **Voice-to-Voice Conversation**
- Push-to-talk speech recognition (Whisper)
- Natural text-to-speech responses
- Practice pronunciation in real conversations

### 👨‍🏫 **Dual-Panel AI Tutor**
- Main panel: Natural Spanish conversation
- Side panel: Ask questions, get translations, receive feedback
- Customizable tutor focus: Grammar, verbs, vocabulary, or custom instructions
- Feedback available in English or Spanish

### 🎭 **Practice Scenarios**
- Pre-built scenarios: Restaurant, Doctor, Travel, Shopping, Job Interview, Phone calls
- Custom goal support: Describe any practice scenario you want
- Grammar focus options: Subjunctive, past tense, commands, por/para, ser/estar
- Target vocabulary: Import CSV or enter manually

### ⚡ **Performance Optimized**
- Lazy loading for faster startup
- Async storage prevents UI blocking
- Efficient DOM rendering
- Service worker caching for offline support
- See [PERFORMANCE_IMPROVEMENTS.md](PERFORMANCE_IMPROVEMENTS.md) for details

### 📱 **Progressive Web App**
- Install as a standalone app
- Works offline after first load
- Responsive design for mobile and desktop

---

## 🚀 Quick Start

### Prerequisites

**Browser Requirements**:
- Chrome 113+ or Edge 113+ (WebGPU support required)
- ~4 GB RAM available
- ~2 GB storage for AI model (downloaded once, cached locally)

**Not supported**: Firefox, Safari (WebGPU not yet available)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/pedscoffee/fluid-engine.git
   cd fluid-engine
   ```

2. **Serve locally**:
   ```bash
   # Option 1: Python
   python3 -m http.server 8000

   # Option 2: Node.js
   npx http-server -p 8000

   # Option 3: VS Code Live Server extension
   ```

3. **Open in browser**:
   ```
   http://localhost:8000
   ```

4. **First-time setup** (automatic):
   - AI model will download (~2 GB, one-time)
   - Takes 2-5 minutes depending on connection
   - Cached for future use

### First Conversation

1. **Choose your level**:
   - Select "Auto" for adaptive difficulty (recommended)
   - Or choose A1-C2 for fixed difficulty

2. **Optional - Import Anki deck**:
   - Click "Import APKG" or "Import TSV/Text"
   - See [test-data/README.md](test-data/README.md) for test files

3. **Optional - Set a goal**:
   - Choose a quick scenario (e.g., "Restaurant")
   - Or describe a custom goal (e.g., "Practice subjunctive commands")

4. **Start chatting**:
   - Type in Spanish or use push-to-talk
   - AI responds in Spanish, tutor panel shows English translation
   - Keep responses short to maintain dialogue flow

---

## 📖 How It Works

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (Client)                     │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Whisper   │  │   WebLLM     │  │     TTS      │   │
│  │   (STT)     │  │ (Llama 3.2)  │  │  (Browser)   │   │
│  └─────────────┘  └──────────────┘  └──────────────┘   │
│         │                 │                  │           │
│         └─────────────────┴──────────────────┘           │
│                           │                               │
│                    ┌──────▼──────┐                       │
│                    │  WebGPU     │                       │
│                    │  Inference  │                       │
│                    └─────────────┘                       │
│                                                           │
│  ┌────────────────────────────────────────────────┐     │
│  │           Local Storage / IndexedDB             │     │
│  │  • Anki decks  • Conversations  • Preferences  │     │
│  └────────────────────────────────────────────────┘     │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Key Components

| Module | Purpose | File |
|--------|---------|------|
| **App** | Entry point, WebGPU check, initialization | `js/app.js` |
| **UI** | Interface, event handlers, Anki imports | `js/ui.js` |
| **Conversation** | WebLLM engine, message history, main chat | `js/conversation.js` |
| **Prompt Builder** | Assembles system prompts from user preferences | `js/promptBuilder.js` |
| **Templates** | Difficulty levels, grammar/vocab focus text | `js/templates.js` |
| **Tutor** | Side panel, translations, feedback, Q&A | `js/tutor.js` |
| **Speech** | Whisper STT, browser TTS, audio handling | `js/speech.js` |
| **Anki Data** | APKG parsing, mastery categorization | `js/ankiData.js` |
| **Async Storage** | Non-blocking localStorage wrapper | `js/asyncStorage.js` |

### Prompt System

Soltura builds dynamic system prompts based on user preferences. See [PROMPTS.md](PROMPTS.md) for complete documentation.

**Prompt assembly**:
1. Base role (friendly Spanish tutor)
2. Difficulty level (Auto/A1-C2/Native)
3. Anki vocabulary scaffolding (if imported)
4. Target vocabulary (if provided)
5. Grammar focus (if selected)
6. Custom instructions (scenario or user goal)
7. General rules (Spanish only, concise, reflective feedback)

**Example prompt**: See [PROMPTS.md - Complete Example](PROMPTS.md#example-complete-prompt)

---

## 🧪 Testing

### Test Data

The `test-data/` directory contains sample Anki files for testing:

1. **TSV files** (simple):
   - `spanish-mastered.txt` - 30 basic words
   - `spanish-learning.txt` - 23 intermediate words
   - `spanish-new.txt` - 16 advanced words

2. **APKG generator** (realistic scheduling data):
   - Open `test-data/generate-apkg.html` in browser
   - Generate test decks with realistic intervals
   - Import into Soltura

See [test-data/README.md](test-data/README.md) for full testing guide.

### Manual Testing

**Test adaptive mode**:
1. Start conversation with Auto difficulty
2. First message: Simple (e.g., "Hola, me llamo Juan")
3. AI should respond at ~A2-B1 level
4. Next message: Complex (e.g., "Si tuviera más tiempo, habría viajado a España el año pasado")
5. AI should elevate to ~B2-C1 level
6. Verify AI adapts within 1-2 exchanges

**Test Anki scaffolding**:
1. Import test deck
2. Start conversation
3. Click debug button (🛈) to view system prompt
4. Verify vocabulary samples appear in prompt
5. In conversation, notice AI uses mastered words more frequently
6. Ask about a "new" word - AI should explain with familiar vocabulary

---

## 🎯 Usage Tips

### Getting the Best Results

1. **Use Auto mode**: Unless you have a specific reason, let the AI adapt to you
2. **Keep it conversational**: Short messages (1-3 sentences) work best
3. **Don't overthink**: Make mistakes! The AI corrects naturally without lecturing
4. **Use the tutor**: Ask questions, request explanations, get vocabulary help
5. **Import your Anki deck**: Personalized vocabulary scaffolding is powerful
6. **Try scenarios**: Role-playing (restaurant, doctor) builds practical skills
7. **Push-to-talk**: Speaking out loud improves pronunciation and fluency

### Common Issues

**Model fails to load**:
- Check internet connection (first-time download is ~2 GB)
- Ensure at least 4 GB RAM available
- Try clearing browser cache and reloading
- Check WebGPU support: `chrome://gpu`

**Audio not working**:
- Grant microphone permissions
- Check browser settings allow audio
- Try refreshing the page

**Slow responses**:
- First response after loading model is slower (~5-10 seconds)
- Subsequent responses should be faster (~2-3 seconds)
- Reduce Anki deck size if very large (>1000 cards)
- Close other browser tabs to free GPU memory

**Anki import fails**:
- For APKG: Ensure sql.js and JSZip libraries load (check console)
- For TSV: Use tab-separated format: `spanish_word<TAB>english_translation`
- Large decks (>2000 cards) may be slow to import

---

## 🗂️ Project Structure

```
fluid-engine/
├── index.html                  # Main application page
├── manifest.json               # PWA manifest
├── sw.js                       # Service worker (offline support)
├── README.md                   # This file
├── PROMPTS.md                  # Complete prompt documentation
├── PERFORMANCE_IMPROVEMENTS.md # Optimization details
│
├── css/
│   └── styles.css              # Application styles
│
├── js/
│   ├── app.js                  # Entry point
│   ├── ui.js                   # UI handlers (856 lines)
│   ├── conversation.js         # Main conversation logic
│   ├── promptBuilder.js        # Prompt assembly
│   ├── templates.js            # Difficulty levels, grammar/vocab
│   ├── tutor.js                # Tutor panel logic
│   ├── speech.js               # Whisper + TTS
│   ├── ankiData.js             # APKG/TSV parsing (452 lines)
│   ├── asyncStorage.js         # Non-blocking storage
│   ├── preferences.js          # User preferences
│   ├── scenarios.js            # Practice scenarios
│   ├── config.js               # Model configuration
│   └── webgpu-check.js         # Browser compatibility
│
├── images/
│   ├── logo.png                # Soltura logo
│   ├── icon.png                # App icon
│   └── favicon.ico             # Favicon
│
└── test-data/
    ├── README.md               # Testing guide
    ├── generate-apkg.html      # APKG file generator
    ├── spanish-mastered.txt    # Test vocabulary (mastered)
    ├── spanish-learning.txt    # Test vocabulary (learning)
    └── spanish-new.txt         # Test vocabulary (new)
```

**Total**: ~2,500 lines of JavaScript

---

## 🔧 Configuration

### Model Configuration

**Location**: `js/config.js`

```javascript
export const config = {
    modelId: "Llama-3.2-3B-Instruct-q4f32_1-MLC"
};
```

**Alternative models**: See [WebLLM model list](https://github.com/mlc-ai/web-llm#available-models)

### Adjusting Token Limits

**Main conversation**: `js/conversation.js:82`
```javascript
max_tokens: 256  // Increase to 384-512 for longer responses
```

**Tutor responses**: `js/tutor.js:130`
```javascript
max_tokens: 512  // Already generous for explanations
```

### Adjusting Anki Sampling

**Location**: `js/promptBuilder.js:54-90`

Current sampling: 15 mastered, 15 familiar, 12 learning, 10 new

```javascript
const masteredSample = this.sampleWords(ankiGuidance.mastered, 15); // Increase for more context
```

**Trade-off**: More samples = better vocabulary guidance, but higher token usage

### Temperature Tuning

**Location**: `js/conversation.js:80` and `js/tutor.js:128`

```javascript
temperature: 0.7  // Lower (0.5) = more predictable, Higher (0.9) = more creative
```

---

## 🛠️ Development

### Prerequisites

- Node.js (optional, for development server)
- Python (optional, for simple HTTP server)
- Modern code editor (VS Code recommended)

### Local Development

```bash
# Clone repository
git clone https://github.com/pedscoffee/fluid-engine.git
cd fluid-engine

# Serve locally (choose one)
python3 -m http.server 8000
# or
npx http-server -p 8000

# Open browser
open http://localhost:8000
```

### Code Quality

**Planned**:
- ESLint + Prettier (not yet configured)
- Unit tests with Vitest (not yet implemented)
- E2E tests with Playwright (not yet implemented)

**Current**: Manual testing, console logging

### Contributing

Contributions welcome! Areas that need help:

1. **Prompt refinement** - See [PROMPTS.md](PROMPTS.md)
2. **More scenarios** - Expand `js/scenarios.js`
3. **Testing** - Unit tests, E2E tests
4. **Accessibility** - WCAG compliance audit
5. **Mobile UX** - Touch interface improvements
6. **Documentation** - More examples, tutorials
7. **AudioWorklet migration** - Replace deprecated ScriptProcessorNode
8. **Multi-language support** - French, German, Italian, etc.

---

## 📊 Performance

### Benchmarks (Estimated)

| Metric | Value |
|--------|-------|
| Initial load time | 30-90s (one-time model download) |
| First response | 5-10s (model initialization) |
| Subsequent responses | 2-4s (depends on prompt complexity) |
| Anki import (500 cards) | 2-5s |
| Anki import (2000 cards) | 10-20s |
| Memory usage | 2-4 GB (model + browser) |

### Optimizations Implemented

See [PERFORMANCE_IMPROVEMENTS.md](PERFORMANCE_IMPROVEMENTS.md) for complete details:

- ✅ Efficient shuffle algorithm (reservoir sampling)
- ✅ Reduced prompt token usage (~45% reduction)
- ✅ Resource hints for faster loading
- ✅ Async localStorage (non-blocking)
- ✅ Optimized DOM operations (DocumentFragment)
- ✅ Service worker CDN caching
- ✅ Memory cleanup for audio buffers
- ✅ Lazy loading for Anki module

---

## 🔐 Privacy & Security

### Data Storage

All data is stored **locally** in your browser:

- **localStorage**: Preferences, Anki data, conversation history
- **IndexedDB**: AI model cache (WebLLM)
- **Cache Storage**: Static assets, CDN resources (service worker)

**No external servers**: Nothing is transmitted outside your browser.

### Data Retention

- Conversations: Expire after 24 hours (configurable in `js/conversation.js:156`)
- Anki data: Persists until manually cleared
- Preferences: Persists indefinitely
- Model cache: Persists indefinitely

### Clearing Data

**Clear Anki data**: Click "Clear Anki Data" button in setup screen

**Clear all data**:
```javascript
// Browser console
localStorage.clear();
indexedDB.deleteDatabase('webllm');
```

**Clear cache**:
- Chrome: Settings → Privacy → Clear browsing data → Cached files

---

## 🗺️ Roadmap

### Planned Features

- [ ] **Conversation history UI** - View and restore past conversations
- [ ] **Statistics dashboard** - Track vocabulary usage, speaking time, progress
- [ ] **Pronunciation feedback** - Analyze pronunciation from Whisper transcription
- [ ] **Export conversations** - Download as PDF, text, or Anki deck
- [ ] **Bi-directional Anki sync** - Update intervals based on conversation performance
- [ ] **More languages** - French, German, Italian templates
- [ ] **Scenario library** - Community-contributed scenarios
- [ ] **Achievement system** - Gamification for motivation
- [ ] **Mobile app** - Capacitor/Tauri wrapper for native experience

### Technical Improvements

- [ ] **Unit tests** - Vitest for core logic
- [ ] **E2E tests** - Playwright for UI flows
- [ ] **ESLint + Prettier** - Code quality tools
- [ ] **TypeScript or JSDoc** - Type safety
- [ ] **AudioWorklet migration** - Remove deprecation warning
- [ ] **Context window management** - Token counting, message truncation
- [ ] **Dynamic temperature** - Adjust by difficulty level
- [ ] **Adaptive max_tokens** - Higher limits for C1/C2/Native

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

Built with:
- [WebLLM](https://github.com/mlc-ai/web-llm) - Browser-based LLM inference
- [Transformers.js](https://github.com/xenova/transformers.js) - Whisper speech recognition
- [sql.js](https://github.com/sql-js/sql.js) - SQLite in the browser (Anki parsing)
- [JSZip](https://github.com/Stuk/jszip) - APKG file extraction
- [Marked](https://github.com/markedjs/marked) - Markdown rendering

Inspired by the need for private, accessible language learning tools.

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/pedscoffee/fluid-engine/issues)
- **Discussions**: [GitHub Discussions](https://github.com/pedscoffee/fluid-engine/discussions)
- **Prompt refinement**: See [PROMPTS.md](PROMPTS.md)
- **Test data**: See [test-data/README.md](test-data/README.md)

---

## 🌟 Star History

If you find Soltura useful, please consider starring the repository!

---

**Practice Spanish naturally. Just say what you want.**

_¡Buena suerte con tu práctica!_ 🇪🇸
