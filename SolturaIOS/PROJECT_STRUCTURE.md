# Soltura iOS - Project Structure

Complete overview of the iOS app architecture and file organization.

## Directory Structure

```
SolturaIOS/
├── Soltura.xcodeproj/              # Xcode project file
│   └── project.pbxproj             # Project configuration
├── Soltura/                        # Main application source
│   ├── SolturaApp.swift            # App entry point (@main)
│   ├── Views/                      # SwiftUI views
│   │   ├── ContentView.swift       # Root navigation view
│   │   ├── SetupView.swift         # Initial configuration screen
│   │   ├── ConversationView.swift  # Chat interface
│   │   └── TutorPanelView.swift    # AI tutor sidebar
│   ├── Models/                     # Data models
│   │   ├── UserPreferences.swift   # Settings & configuration
│   │   └── Scenarios.swift         # Conversation scenarios
│   ├── Managers/                   # Business logic
│   │   ├── LLMManager.swift        # On-device LLM inference
│   │   ├── SpeechManager.swift     # Speech recognition & TTS
│   │   ├── PromptBuilder.swift     # System prompt generation
│   │   ├── ConversationManager.swift # Conversation state
│   │   └── AnkiManager.swift       # Anki deck imports
│   ├── Assets.xcassets/            # Images, icons, colors
│   │   ├── AppIcon.appiconset/     # App icons
│   │   └── AccentColor.colorset/   # Teal theme color
│   └── Info.plist                  # App configuration
├── README.md                        # Main documentation
├── QUICKSTART.md                    # Quick setup guide
├── APP_STORE_SUBMISSION.md          # Submission guide
├── PROJECT_STRUCTURE.md             # This file
├── LICENSE                          # MIT License
└── .gitignore                       # Git ignore rules
```

## Architecture Overview

### MVVM Pattern

The app follows the Model-View-ViewModel pattern:

- **Models**: `UserPreferences`, `Scenario`, `Message`, `AnkiCard`
- **Views**: SwiftUI views (`SetupView`, `ConversationView`, etc.)
- **ViewModels/Managers**: `@ObservableObject` classes that manage state

### Data Flow

```
User Input → View → Manager → LLM/Speech → Manager → View → UI Update
```

Example: Sending a message
```
ConversationView.sendMessage()
    ↓
ConversationManager.sendMessage()
    ↓
LLMManager.generateResponse()
    ↓
ConversationManager updates @Published messages
    ↓
SwiftUI automatically updates UI
```

## Key Files Explained

### SolturaApp.swift
- Entry point with `@main` attribute
- Sets up environment objects
- Configures app-wide appearance (teal theme)

### ContentView.swift
- Root view controller
- Handles navigation between Setup and Conversation screens
- Manages screen transitions

### SetupView.swift
**Purpose**: Initial configuration before starting conversation

**Features**:
- Proficiency level selection (A1-C2, Auto, Native)
- Target vocabulary input
- Anki deck import (TSV/CSV)
- Grammar focus selection
- Scenario picker (50+ options)
- Custom goal text area

**State Management**:
- Local `@State` for form inputs
- Passes final preferences to `ConversationManager`

### ConversationView.swift
**Purpose**: Main chat interface

**Components**:
- Top bar (status, navigation, settings)
- Message list (scrollable chat)
- Input area (text + voice button)
- Settings sheet
- System prompt viewer

**Features**:
- Text message sending
- Voice recording (push-to-talk)
- TTS playback of responses
- Tutor panel toggle
- Conversation clearing

### TutorPanelView.swift
**Purpose**: AI tutor sidebar for feedback

**Features**:
- Automatic feedback based on preset (translation, grammar, etc.)
- Manual question input
- Collapsible settings
- Bilingual feedback (EN/ES toggle)

**Presets**:
- Translation Only (default)
- Grammar Explanations
- Irregular Verbs
- Vocabulary Building
- Common Mistakes
- Custom instruction

### LLMManager.swift
**Purpose**: On-device LLM inference

**Current State**: Simulation (replace with real LLM)

**Integration Points**:
```swift
// Initialize model
func initialize(progressCallback: @escaping (Float, String) -> Void) async throws

// Generate response
func generateResponse(userMessage: String) async throws -> String

// Optional translation
func translate(text: String, from: String, to: String) async throws -> String
```

**Production Implementation**:
- Load GGUF model from bundle
- Initialize llama.cpp context
- Tokenize input
- Run inference with Metal acceleration
- Stream or return complete response

### SpeechManager.swift
**Purpose**: Speech recognition and text-to-speech

**Features**:
- iOS native `Speech` framework integration
- Spanish speech recognition (`es-ES` locale)
- AVSpeechSynthesizer for TTS
- Multiple Spanish voice options
- Mute toggle

**Authorization Flow**:
```swift
1. Request permission on app launch
2. Check authorization status
3. Enable/disable features based on status
```

### PromptBuilder.swift
**Purpose**: Generate system prompts for LLM

**Key Components**:
- Difficulty level instructions (A1-C2, Auto, Native)
- Anki vocabulary scaffolding
- Grammar focus directives
- Scenario instructions
- Custom goal integration

**Prompt Structure**:
```
1. Base role (friendly Spanish tutor)
2. Difficulty level guidelines
3. Anki vocabulary context (if available)
4. Target vocabulary list
5. Grammar focus areas
6. Scenario/custom goal
7. General rules (Spanish only, concise, reflective feedback)
```

### ConversationManager.swift
**Purpose**: Orchestrate conversation flow

**Responsibilities**:
- Initialize LLM
- Manage message history
- Coordinate between LLM and Speech managers
- Generate tutor feedback
- Handle errors gracefully

**State**:
- `@Published var messages: [Message]`
- `@Published var tutorMessages: [TutorMessage]`
- `@Published var isLoading: Bool`
- `@Published var connectionStatus: String`

### AnkiManager.swift
**Purpose**: Import and manage Anki vocabulary

**Supported Formats**:
- TSV (tab-separated values) ✅
- CSV (comma-separated values) ✅
- APKG (Anki package) ⏳ (stub implementation)

**Mastery Levels**:
- **Mastered**: 180+ day interval
- **Familiar**: 21-180 day interval
- **Learning**: 7-21 day interval
- **New**: <7 day interval

**APKG Implementation**:
To fully implement APKG:
1. Add ZIPFoundation for unzipping
2. Add SQLite.swift for database parsing
3. Extract scheduling data from collection.anki21
4. Map intervals to mastery levels

### UserPreferences.swift
**Purpose**: Define all user settings and data structures

**Key Types**:
```swift
struct UserPreferences
enum ProficiencyLevel: A1, A2, B1, B2, C1, C2, Native, Auto
enum GrammarFocus: present, preterite, imperfect, future, subjunctive
enum TutorPreset: translation, grammar, verbs, vocabulary, mistakes, custom
enum MasteryLevel: mastered, familiar, learning, new
struct AnkiCard
```

### Scenarios.swift
**Purpose**: Define 50+ conversation scenarios

**Structure**:
```swift
struct Scenario {
    let id: String
    let title: String
    let instruction: String  // LLM guidance
    let category: String
}
```

**Categories** (14 total):
- Dining & Food
- Health & Wellness
- Travel & Transportation
- Shopping & Services
- Work & Professional
- Social & Personal
- Housing & Home
- Education & Learning
- Entertainment & Culture
- Emergency & Special
- Hobbies & Interests
- Technology & Modern Life
- Customs & Culture
- Nature & Outdoors

## Design Patterns & Best Practices

### Observable Objects
All managers use `@ObservableObject` for SwiftUI integration:
```swift
class ConversationManager: ObservableObject {
    @Published var messages: [Message] = []
    // SwiftUI auto-updates when @Published properties change
}
```

### Async/Await
Modern concurrency for all async operations:
```swift
// Good
await conversationManager.sendMessage(text)

// Not used: completion handlers
conversationManager.sendMessage(text) { result in ... }
```

### Environment Objects
Shared state across views:
```swift
// SolturaApp.swift
.environmentObject(conversationManager)

// Any child view
@EnvironmentObject var conversationManager: ConversationManager
```

### Error Handling
Graceful error handling with user-friendly messages:
```swift
do {
    try await speechManager.startRecording { text in ... }
} catch {
    print("Error: \(error)")
    // Show user-friendly error
}
```

### Separation of Concerns
- **Views**: UI only, no business logic
- **Managers**: Business logic, no UI code
- **Models**: Data structures only

## State Management

### App-Level State
```
SolturaApp
├── ConversationManager (EnvironmentObject)
└── SpeechManager (EnvironmentObject)
```

### View-Level State
```
SetupView
├── @State var preferences (local form state)
└── @StateObject var ankiManager (view-owned)

ConversationView
├── @State var inputText (local input)
├── @State var showSettings (modal state)
└── Uses @EnvironmentObject for shared state
```

## Threading Model

### Main Thread
- All UI updates
- @Published property changes
- User interactions

### Background Threads
- LLM inference
- File I/O (Anki imports)
- Network (if any)

### Thread Safety
```swift
// Always update @Published on main thread
await MainActor.run {
    self.messages.append(newMessage)
}
```

## Asset Management

### App Icons
- 1024x1024 source in `AppIcon.appiconset`
- Xcode generates all sizes automatically

### Colors
- Accent color: `#2D6A6A` (teal) defined in Assets
- Uses semantic colors: `.primary`, `.secondary` for dark mode

### Images
- Vector PDFs for scalability
- Use SF Symbols when possible

## Performance Considerations

### Memory Management
- LLM model: 700MB-2GB
- Context: 128-256MB during inference
- Total app: <500MB steady state

### Optimization Strategies
1. **Metal Acceleration**: GPU for LLM inference
2. **Quantization**: Q4_K_M models (4-bit)
3. **Context Management**: Clear old messages
4. **Lazy Loading**: Use `LazyVStack` for message lists
5. **Debouncing**: Avoid rapid-fire requests

### Battery Optimization
- Run inference on Neural Engine when possible
- Limit max_tokens to 256
- Use efficient sampling strategies
- Avoid continuous background processing

## Privacy & Security

### On-Device Processing
- All LLM inference on device
- No data sent to servers
- No analytics or tracking

### Data Storage
- User preferences: UserDefaults
- Anki data: UserDefaults
- Messages: In-memory only (not persisted)
- No cloud storage

### Permissions
- Microphone: For speech recognition
- Speech Recognition: For Spanish transcription
- No other permissions required

## Testing Strategy

### Manual Testing Checklist
- [ ] Run on iPhone 13, 14, 15+
- [ ] Test all proficiency levels
- [ ] Import various Anki formats
- [ ] Voice recognition in quiet/noisy environments
- [ ] TTS voice quality
- [ ] All 50+ scenarios
- [ ] Settings persistence
- [ ] Low memory handling
- [ ] Interruption handling (calls, etc.)

### Automated Testing
Not included in v1.0 but recommended:
- Unit tests for PromptBuilder
- Integration tests for AnkiManager
- UI tests for critical flows
- Performance tests for LLM inference

## Future Enhancements

### Planned Features
1. **APKG Import**: Full Anki package support
2. **Conversation History**: Save and review past chats
3. **Export to Anki**: Create flashcards from conversations
4. **Progress Tracking**: Analytics and statistics
5. **Multiple Dialects**: Mexico, Argentina, Colombia options
6. **Offline Mode Indicator**: Clear UI for offline status
7. **Widget**: Quick practice sessions

### Technical Debt
- Replace LLM simulation with real implementation
- Add comprehensive error handling
- Implement proper logging
- Add analytics (privacy-preserving)
- Performance profiling and optimization

## Development Workflow

### Local Development
```bash
1. Open Soltura.xcodeproj in Xcode
2. Select device/simulator
3. Cmd+R to run
4. Make changes → Auto-reload with hot reload
```

### Testing on Device
```bash
1. Connect iPhone via USB
2. Select device in Xcode
3. Trust computer on device
4. Cmd+R to build and run
```

### Archiving for Release
```bash
1. Product → Archive
2. Validate App
3. Distribute to App Store Connect
```

## Troubleshooting Development Issues

### Build Errors
- **Missing model file**: Add .gguf to project
- **Signing error**: Select team in Signing & Capabilities
- **Import not found**: Add package dependency

### Runtime Errors
- **Crash on model load**: Check file size and format
- **Speech not working**: Grant permissions in Settings
- **UI not updating**: Ensure @Published on MainActor

### Performance Issues
- **Slow responses**: Reduce n_ctx, use Q4 quantization
- **High memory**: Clear message history periodically
- **Battery drain**: Profile with Instruments

## Contributing Guidelines

1. **Code Style**:
   - Follow Swift API Design Guidelines
   - Use meaningful variable names
   - Comment complex logic
   - Keep functions focused and small

2. **Git Workflow**:
   - Feature branches: `feature/description`
   - Bug fixes: `fix/description`
   - Clear commit messages

3. **Testing**:
   - Test on multiple devices
   - Verify all features work
   - Check performance metrics

4. **Documentation**:
   - Update README for user-facing changes
   - Update this file for architectural changes
   - Add inline comments for complex code

## Resources

- [SwiftUI Documentation](https://developer.apple.com/documentation/swiftui)
- [Speech Framework](https://developer.apple.com/documentation/speech)
- [llama.cpp GitHub](https://github.com/ggerganov/llama.cpp)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

---

**Maintained by**: Soltura Development Team
**Last Updated**: 2025-12-01
**Version**: 1.0
