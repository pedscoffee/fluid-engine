# Soltura iOS - Quick Start Guide

Get up and running with Soltura iOS in 15 minutes!

## Prerequisites

- macOS Ventura or later
- Xcode 15+ installed
- iPhone 13+ or newer (for testing with real LLM)
- Apple Developer account (free tier OK for development)

## 5-Minute Setup (Testing with Simulation)

Want to see the app working immediately? Follow these steps:

### 1. Open Project
```bash
cd SolturaIOS
open Soltura.xcodeproj
```

### 2. Configure Signing
- Click on "Soltura" project in left sidebar
- Select "Soltura" target
- Go to "Signing & Capabilities" tab
- Check "Automatically manage signing"
- Select your Team (or "Add Account" if needed)

### 3. Run on Simulator
- Select iPhone 15 Pro from device dropdown
- Click Run button (▶) or press Cmd+R
- Grant permissions when prompted
- Test the app with simulated responses

**Current State**: The app uses simulated Spanish responses. To get real AI, continue to "Full LLM Integration" below.

## Full LLM Integration (30-60 minutes)

To get actual AI-powered Spanish conversations:

### Option 1: llama.cpp (Recommended)

#### Step 1: Add llama.cpp Package

In Xcode:
1. File → Add Package Dependencies
2. Enter: `https://github.com/ggerganov/llama.cpp`
3. Click "Add Package"

#### Step 2: Download Model

Choose based on your device:

**iPhone 15 Pro or newer (3GB+ free):**
```bash
# Download Llama 3.2 3B Q4_K_M (~2GB)
curl -L -o model.gguf \
  https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf
```

**iPhone 13-14 (700MB-2GB free):**
```bash
# Download Llama 3.2 1B Q4_K_M (~700MB)
curl -L -o model.gguf \
  https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf
```

#### Step 3: Add Model to Xcode

1. Drag `model.gguf` into Xcode project
2. Check "Copy items if needed"
3. Ensure "Soltura" target is checked
4. Verify file appears in project navigator

#### Step 4: Implement llama.cpp Integration

Open `Soltura/Managers/LLMManager.swift` and replace the simulation code:

```swift
import llama

class LLMManager: ObservableObject {
    // ... existing properties ...
    private var context: OpaquePointer?
    private var model: OpaquePointer?

    func initialize(progressCallback: @escaping (Float, String) -> Void) async throws {
        await MainActor.run {
            initializationMessage = "Loading model..."
            initializationProgress = 0.0
        }

        // Get model path
        guard let modelPath = Bundle.main.path(forResource: "model", ofType: "gguf") else {
            throw NSError(domain: "LLM", code: 1, userInfo: [
                NSLocalizedDescriptionKey: "Model file not found in bundle"
            ])
        }

        // Initialize llama
        llama_backend_init(false)

        // Load model
        var modelParams = llama_model_default_params()
        modelParams.n_gpu_layers = 99 // Use Metal GPU
        modelParams.use_mlock = true

        model = llama_load_model_from_file(modelPath, modelParams)
        guard model != nil else {
            throw NSError(domain: "LLM", code: 2, userInfo: [
                NSLocalizedDescriptionKey: "Failed to load model"
            ])
        }

        await MainActor.run { initializationProgress = 0.5 }

        // Create context
        var ctxParams = llama_context_default_params()
        ctxParams.n_ctx = 2048
        ctxParams.n_threads = 4
        ctxParams.n_threads_batch = 4

        context = llama_new_context_with_model(model, ctxParams)
        guard context != nil else {
            throw NSError(domain: "LLM", code: 3, userInfo: [
                NSLocalizedDescriptionKey: "Failed to create context"
            ])
        }

        await MainActor.run {
            initializationProgress = 1.0
            isInitialized = true
        }
    }

    func generateResponse(userMessage: String) async throws -> String {
        guard isInitialized, let context = context else {
            throw NSError(domain: "LLM", code: 4, userInfo: [
                NSLocalizedDescriptionKey: "LLM not initialized"
            ])
        }

        messages.append(["role": "user", "content": userMessage])

        // Build prompt
        let prompt = buildPrompt(messages: messages)

        // Tokenize
        let tokens = tokenize(text: prompt, addBos: true)

        // Generate
        var result = ""
        var nCur = tokens.count
        let nLen = 256 // max tokens

        // Evaluate initial prompt
        if llama_decode(context, llama_batch_get_one(tokens, Int32(tokens.count), 0, 0)) != 0 {
            throw NSError(domain: "LLM", code: 5, userInfo: [
                NSLocalizedDescriptionKey: "Failed to evaluate prompt"
            ])
        }

        // Generate tokens
        while nCur < nLen {
            let newTokenId = llama_sampler_sample(sampler, context, -1)

            if newTokenId == llama_token_eos(model) {
                break
            }

            let piece = String(cString: llama_token_to_piece(model, newTokenId))
            result += piece

            // Evaluate next token
            if llama_decode(context, llama_batch_get_one([newTokenId], 1, Int32(nCur), 0)) != 0 {
                break
            }

            nCur += 1
        }

        messages.append(["role": "assistant", "content": result])
        return result.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private func tokenize(text: String, addBos: Bool) -> [Int32] {
        let nTokens = text.utf8.count + (addBos ? 1 : 0)
        var tokens = [Int32](repeating: 0, count: nTokens)

        let count = llama_tokenize(
            model,
            text,
            Int32(text.utf8.count),
            &tokens,
            Int32(nTokens),
            addBos,
            false
        )

        return Array(tokens.prefix(Int(count)))
    }

    private func buildPrompt(messages: [[String: String]]) -> String {
        var prompt = ""
        for message in messages {
            let role = message["role"] ?? ""
            let content = message["content"] ?? ""

            if role == "system" {
                prompt += "<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n\(content)<|eot_id|>"
            } else if role == "user" {
                prompt += "<|start_header_id|>user<|end_header_id|>\n\n\(content)<|eot_id|>"
            } else if role == "assistant" {
                prompt += "<|start_header_id|>assistant<|end_header_id|>\n\n\(content)<|eot_id|>"
            }
        }
        prompt += "<|start_header_id|>assistant<|end_header_id|>\n\n"
        return prompt
    }

    deinit {
        if context != nil {
            llama_free(context)
        }
        if model != nil {
            llama_free_model(model)
        }
        llama_backend_free()
    }
}
```

#### Step 5: Build and Test

1. Clean build folder: Product → Clean Build Folder (Shift+Cmd+K)
2. Build: Cmd+B
3. Run on device: Select your iPhone, press Cmd+R
4. Wait for model to load (30-60 seconds first time)
5. Start chatting in Spanish!

### Option 2: MLX Swift (Apple Silicon Optimized)

Coming soon - MLX Swift is newer but optimized specifically for Apple Silicon.

## Troubleshooting

### "Model file not found"
- Verify model.gguf is in project
- Check it's added to Soltura target
- Clean build folder and rebuild

### "Failed to load model"
- Check model file isn't corrupted (verify size)
- Ensure enough storage space
- Try smaller model if on older device

### "App crashes on launch"
- Check memory pressure (close other apps)
- Try on device, not simulator
- Reduce n_ctx to 1024 if needed

### "Responses are gibberish"
- Verify you're using Llama 3.2 Instruct model (not base)
- Check prompt format matches model's expected format
- Ensure model is Q4_K_M quantization

### "Very slow responses"
- Enable Metal GPU acceleration (n_gpu_layers = 99)
- Reduce max tokens to 128
- Use more aggressive quantization (Q4 vs Q5)

## Testing Checklist

Before considering it "done":

- [ ] Model loads successfully
- [ ] Can have Spanish conversation
- [ ] Voice recognition works
- [ ] TTS speaks Spanish
- [ ] Anki import functions
- [ ] App doesn't crash after 30 min use
- [ ] Works without internet
- [ ] Memory stays reasonable (<500MB)

## Next Steps

1. **Test thoroughly** on device
2. **Create app icon** (1024x1024)
3. **Review privacy policy** requirements
4. **Prepare screenshots** for App Store
5. **Follow APP_STORE_SUBMISSION.md** for complete guide

## Common Questions

**Q: Can I use GPT-4 or Claude API instead?**
A: Not recommended for App Store. Apple prefers on-device ML. Plus, this approach is private and works offline.

**Q: Can this run on iPhone 12 or earlier?**
A: iPhone 13+ is recommended. Earlier models lack the NPU power for smooth experience.

**Q: How big is the final app?**
A: ~2.5GB with 3B model, ~1.2GB with 1B model. Large but acceptable for education apps.

**Q: Can I use a different language model?**
A: Yes! Any GGUF-format model works. Just adjust the prompt format accordingly.

**Q: Do I need paid Apple Developer account?**
A: Free tier works for development. Need paid ($99/year) to publish to App Store.

## Resources

- **llama.cpp**: https://github.com/ggerganov/llama.cpp
- **Model Hub**: https://huggingface.co/models?library=gguf
- **Swift Forums**: https://forums.swift.org
- **Full Docs**: See README.md

## Getting Help

If stuck:
1. Check error message carefully
2. Search llama.cpp issues on GitHub
3. Ask in r/iOSProgramming
4. Review Apple's ML documentation

---

**Time Investment**:
- Simulation setup: 5 minutes
- Full LLM integration: 30-60 minutes
- App Store submission: 2-4 hours

**Total to working app**: ~1-2 hours
**Total to App Store ready**: ~4-8 hours

Good luck! 🚀

¿Listo para comenzar? (Ready to start?)
