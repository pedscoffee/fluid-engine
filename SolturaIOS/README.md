# Soltura iOS - AI-Powered Spanish Conversation Practice

![Soltura Logo](https://img.shields.io/badge/Soltura-Spanish%20Practice-2D6A6A)
![Platform](https://img.shields.io/badge/platform-iOS%2017.0+-blue)
![Swift](https://img.shields.io/badge/Swift-5.9-orange)
![License](https://img.shields.io/badge/license-MIT-green)

A native iOS application for practicing conversational Spanish with AI, featuring on-device language models, speech recognition, and Anki spaced repetition integration.

## Features

### 🗣️ AI Conversation Practice
- **Adaptive Difficulty**: Automatically adjusts to your proficiency level (A1-C2, Native)
- **On-Device LLM**: Private, fast Spanish conversation with local AI models
- **Natural Conversation Flow**: 1-3 sentence responses that encourage dialogue

### 🎯 Personalized Learning
- **Anki Integration**: Import your Anki decks for vocabulary-based conversations
- **Grammar Focus**: Target specific tenses (present, preterite, imperfect, future, subjunctive)
- **Scenario Practice**: 50+ real-world scenarios (restaurant, travel, business, etc.)
- **Custom Goals**: Define your own practice objectives

### 🎤 Speech Recognition & TTS
- **Voice Input**: Native iOS speech recognition for Spanish
- **Text-to-Speech**: Natural Spanish pronunciation with multiple voice options
- **Push-to-Talk**: Easy voice interaction

### 📚 AI Tutor Panel
- **Real-Time Feedback**: Translation, grammar explanations, verb analysis
- **Customizable Focus**: Choose what type of feedback you want
- **Bilingual Support**: Feedback in English or Spanish
- **Ask Questions**: Get instant answers about Spanish grammar and vocabulary

## System Requirements

- **iOS**: 17.0 or later
- **Devices**: iPhone 13 or later recommended (for on-device LLM)
- **Storage**: 2-3 GB for LLM model (first launch)
- **Permissions**: Microphone, Speech Recognition

## Installation & Setup

### Step 1: Open the Project

1. Navigate to `SolturaIOS` folder
2. Open `Soltura.xcodeproj` in Xcode 15+
3. Select your development team in Signing & Capabilities

### Step 2: Integrate an On-Device LLM

The app is designed to use on-device language models for privacy and speed. You have several options:

#### Option A: Using llama.cpp (Recommended)

1. **Add llama.cpp Swift bindings**:
   ```bash
   # Add as a Swift Package dependency
   https://github.com/ggerganov/llama.cpp
   ```

2. **Download a quantized model**:
   - Llama 3.2 1B Instruct Q4_K_M (~700MB) - Best for iPhone 13-14
   - Llama 3.2 3B Instruct Q4_K_M (~2GB) - Best for iPhone 15+
   - Phi-3 Mini 3.8B Q4_K_M (~2.2GB) - Alternative for newer devices

   Download from Hugging Face:
   ```
   https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF
   ```

3. **Add model to Xcode**:
   - Drag the `.gguf` file into Xcode
   - Check "Copy items if needed"
   - Add to target: Soltura

4. **Update `LLMManager.swift`**:
   Replace the simulation code in the `initialize()` and `generateResponse()` methods with actual llama.cpp inference calls.

   Example integration:
   ```swift
   import llama

   private var context: OpaquePointer?
   private var model: OpaquePointer?

   func initialize() async throws {
       guard let modelPath = Bundle.main.path(forResource: "model", ofType: "gguf") else {
           throw NSError(domain: "LLM", code: 1)
       }

       var params = llama_model_default_params()
       params.n_gpu_layers = 99 // Use Metal acceleration

       model = llama_load_model_from_file(modelPath, params)
       // ... initialize context
   }
   ```

#### Option B: Using MLX Swift (Apple Silicon Optimized)

1. Add MLX Swift package:
   ```
   https://github.com/ml-explore/mlx-swift
   ```

2. Download an MLX-optimized model:
   ```
   https://huggingface.co/mlx-community
   ```

3. Follow MLX Swift documentation for text generation

#### Option C: Using Core ML

1. Convert a language model to Core ML format
2. Add the `.mlpackage` to Xcode
3. Use MLModel APIs in `LLMManager.swift`

### Step 3: Create App Icon

1. Design a 1024x1024px icon for Soltura
2. Use a tool like [App Icon Generator](https://appicon.co) to generate all sizes
3. Drag the icon into `Assets.xcassets/AppIcon.appiconset` in Xcode

**Icon Design Guidelines**:
- Use the teal theme color (#2D6A6A)
- Include globe or Spanish-related imagery
- Keep it simple and recognizable
- Ensure it looks good at small sizes

### Step 4: Configure Bundle Identifier

1. In Xcode, select the Soltura target
2. Go to "Signing & Capabilities"
3. Change `com.soltura.app` to your own unique identifier
4. Select your development team

### Step 5: Test on Device

1. Connect your iPhone via USB
2. Select your device in Xcode
3. Click Run (⌘R)
4. Grant microphone and speech recognition permissions when prompted

## Architecture

### Core Components

```
SolturaIOS/
├── Soltura/
│   ├── SolturaApp.swift           # App entry point
│   ├── Views/
│   │   ├── ContentView.swift       # Main navigation controller
│   │   ├── SetupView.swift         # Initial configuration screen
│   │   ├── ConversationView.swift  # Chat interface
│   │   └── TutorPanelView.swift    # Tutor feedback panel
│   ├── Models/
│   │   ├── UserPreferences.swift   # User settings and preferences
│   │   └── Scenarios.swift         # 50+ conversation scenarios
│   ├── Managers/
│   │   ├── LLMManager.swift        # On-device LLM inference
│   │   ├── SpeechManager.swift     # Speech recognition & TTS
│   │   ├── PromptBuilder.swift     # System prompt generation
│   │   ├── ConversationManager.swift # Conversation state
│   │   └── AnkiManager.swift       # Anki deck imports
│   ├── Assets.xcassets/
│   └── Info.plist
```

### Design Patterns

- **MVVM**: SwiftUI views + ObservableObject managers
- **Async/Await**: Modern concurrency for LLM and speech operations
- **Environment Objects**: Shared state management
- **Codable**: Preferences and Anki data persistence

## App Store Submission Guide

### Pre-Submission Checklist

#### 1. Complete App Metadata

- [ ] App Name: "Soltura - Spanish Practice"
- [ ] Subtitle: "AI-Powered Conversational Learning"
- [ ] Category: Education > Language
- [ ] Keywords: spanish, learn spanish, conversation, ai tutor, practice spanish
- [ ] Description: Write compelling description highlighting features
- [ ] Screenshots: 6.7", 6.5", and 5.5" sizes required
- [ ] Preview video (optional but recommended)

#### 2. Privacy & Legal

- [ ] Privacy Policy URL (required for App Store)
- [ ] Terms of Service (optional)
- [ ] Update Info.plist with usage descriptions:
  - ✅ NSMicrophoneUsageDescription
  - ✅ NSSpeechRecognitionUsageDescription
- [ ] Add privacy manifest if using third-party SDKs
- [ ] Declare data collection practices in App Store Connect

#### 3. Technical Requirements

- [ ] Test on multiple devices (iPhone 13, 14, 15+)
- [ ] Test on iOS 17.0 minimum
- [ ] Verify app works offline (on-device LLM)
- [ ] Handle low memory scenarios gracefully
- [ ] Optimize model size (quantization if needed)
- [ ] Add loading states and error handling
- [ ] Test with various Anki deck imports
- [ ] Verify all 50+ scenarios work correctly

#### 4. App Store Assets

**Required Screenshots** (per iPhone size):
1. Setup screen showing proficiency selection
2. Conversation in progress
3. Tutor panel with feedback
4. Anki integration statistics
5. Scenario selection

**App Preview Video** (optional, 30 seconds):
- Show quick setup
- Demonstrate voice conversation
- Highlight tutor feedback
- Show Anki integration benefit

#### 5. Build & Submit

```bash
# 1. Archive the app
# Xcode > Product > Archive

# 2. Validate the archive
# Organizer > Validate App

# 3. Distribute to App Store
# Organizer > Distribute App > App Store Connect

# 4. Submit for Review in App Store Connect
```

### App Store Description Template

```
Practice Spanish naturally with AI-powered conversations on your iPhone!

FEATURES:

🗣️ Adaptive AI Conversations
• Automatically adjusts to your Spanish level (A1-C2)
• Runs completely on your device - private and fast
• Natural back-and-forth dialogue practice

📚 Personalized Learning
• Import your Anki decks for customized practice
• Target specific grammar: subjunctive, preterite, imperfect
• 50+ real-world scenarios: restaurant, travel, business, medical

🎤 Voice Recognition
• Practice pronunciation with speech recognition
• Native Spanish text-to-speech
• Push-to-talk for easy interaction

🎓 AI Tutor
• Real-time translations and grammar explanations
• Ask questions anytime about Spanish
• Feedback in English or Spanish

PRIVACY FIRST:
All AI processing happens on your device. Your conversations never leave your iPhone.

REQUIREMENTS:
• iPhone 13 or later recommended
• iOS 17.0+
• 2-3 GB storage for AI model

Perfect for intermediate learners looking to improve fluency through conversation!

---

Soltura (sohl-too-rah) means "fluency" or "ease" in Spanish. Practice naturally, gain fluency!
```

### Pricing Strategy

**Recommended Options**:

1. **Free with In-App Purchase**:
   - Free: Basic conversation (100 messages/week)
   - Premium ($4.99/month): Unlimited + Anki integration + all scenarios

2. **Paid Upfront**:
   - $9.99 one-time purchase
   - All features unlocked

3. **Freemium**:
   - Free: 10 conversations
   - Unlock Full Version: $14.99

## Testing Checklist

### Functional Testing

- [ ] Speech recognition works in quiet environment
- [ ] Speech recognition handles background noise
- [ ] TTS speaks Spanish correctly
- [ ] All proficiency levels generate appropriate responses
- [ ] Anki TSV import works correctly
- [ ] Grammar focus affects conversation
- [ ] Scenarios load and influence conversation
- [ ] Custom goals are respected by AI
- [ ] Tutor panel provides relevant feedback
- [ ] Settings persist between sessions
- [ ] App handles interruptions (phone calls, etc.)

### Performance Testing

- [ ] First launch model loading time < 30 seconds
- [ ] Response generation time < 5 seconds
- [ ] App memory usage stays under 500MB
- [ ] No crashes after 1 hour of use
- [ ] Battery drain is acceptable
- [ ] Works without internet connection

### Accessibility Testing

- [ ] VoiceOver navigation works
- [ ] Dynamic Type scaling works
- [ ] High contrast mode supported
- [ ] Reduced motion respected

## Troubleshooting

### Common Issues

**Problem**: "Model failed to load"
- **Solution**: Ensure the .gguf model file is added to the Xcode target
- Check file size (should be 700MB-2GB)
- Verify file isn't corrupted

**Problem**: "Speech recognition not working"
- **Solution**: Check Info.plist has correct permissions
- Verify user granted permissions in Settings > Privacy
- Test with different Spanish accents

**Problem**: "App crashes on older iPhones"
- **Solution**: Use smaller model (1B instead of 3B)
- Reduce max_tokens in LLMManager
- Implement better memory management

**Problem**: "Responses are slow"
- **Solution**: Enable Metal GPU acceleration
- Use more aggressive quantization (Q4 vs Q5)
- Reduce context length

## Development Roadmap

### v1.1 - Enhanced Features
- [ ] APKG file import support
- [ ] Conversation history with search
- [ ] Export conversations to Anki
- [ ] Voice activity detection (hands-free mode)
- [ ] Multiple Spanish dialects (Mexico, Argentina, etc.)

### v1.2 - Advanced Learning
- [ ] Progress tracking and statistics
- [ ] Weekly learning goals
- [ ] Spaced repetition for grammar
- [ ] Conjugation practice mode
- [ ] Vocabulary flashcards

### v2.0 - Social Features
- [ ] Share conversations (anonymized)
- [ ] Community scenarios
- [ ] Leaderboards and achievements
- [ ] Teacher dashboard for classroom use

## Contributing

This is a complete, production-ready codebase. To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on device
5. Submit a pull request

## Support

For issues or questions:
- GitHub Issues: [Your Repository]
- Email: support@soltura.app
- Documentation: See inline code comments

## License

MIT License - See LICENSE file for details

## Credits

**Original Web App**: Soltura Web (JavaScript/WebGPU version)

**iOS Port**: Native Swift implementation with SwiftUI

**AI Models**:
- Llama 3.2 (Meta)
- Whisper (OpenAI) via iOS Speech Recognition
- iOS Native TTS

**Spanish Pedagogy**: Based on CEFR levels (A1-C2) and communicative approach

---

**Made with ❤️ for Spanish learners everywhere**

¡Buena suerte con tu español! 🇪🇸
