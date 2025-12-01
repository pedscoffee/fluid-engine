# App Store Submission Guide for Soltura iOS

This comprehensive guide walks you through every step of submitting Soltura to the Apple App Store.

## Phase 1: Pre-Development Checklist

### Apple Developer Account
- [ ] Enroll in Apple Developer Program ($99/year)
- [ ] Verify email and enable two-factor authentication
- [ ] Access to App Store Connect (https://appstoreconnect.apple.com)

### Legal Requirements
- [ ] Create privacy policy (required)
- [ ] Create terms of service (optional but recommended)
- [ ] Host both on a public URL (GitHub Pages, website, etc.)

## Phase 2: App Preparation

### 1. Complete the Code

#### LLM Integration (Critical)
- [ ] Choose LLM implementation (llama.cpp, MLX, or Core ML)
- [ ] Download and add quantized model to project
- [ ] Update `LLMManager.swift` with real inference code
- [ ] Test model loading and inference on device
- [ ] Optimize for memory and battery usage

#### Icon & Assets
- [ ] Design 1024x1024 app icon
- [ ] Generate all required sizes (use appicon.co or similar)
- [ ] Add icons to Assets.xcassets
- [ ] Create launch screen assets
- [ ] Add any additional color assets

#### Bundle Identifier
- [ ] Choose unique identifier (e.g., com.yourcompany.soltura)
- [ ] Update in Xcode project settings
- [ ] Register in App Store Connect

### 2. Testing Requirements

#### Device Testing
- [ ] Test on iPhone 13 Mini
- [ ] Test on iPhone 14 Pro
- [ ] Test on iPhone 15 Pro Max
- [ ] Test on iPad (if supporting)
- [ ] Test on iOS 17.0 (minimum version)
- [ ] Test on latest iOS version

#### Functional Testing Checklist
```
Setup Screen:
- [ ] All proficiency levels selectable
- [ ] TSV import works
- [ ] Vocabulary input accepts text
- [ ] Grammar focus toggles work
- [ ] Scenario selection works
- [ ] Custom goal saves

Conversation Screen:
- [ ] Messages send and receive
- [ ] Voice recording works
- [ ] Speech recognition transcribes Spanish
- [ ] TTS speaks Spanish correctly
- [ ] Tutor panel opens/closes
- [ ] Settings accessible

Tutor Panel:
- [ ] Feedback appears automatically
- [ ] Tutor presets change behavior
- [ ] Custom instructions work
- [ ] Language toggle (EN/ES) works
- [ ] Questions get answers

General:
- [ ] App doesn't crash
- [ ] Handles low memory
- [ ] Works offline
- [ ] Handles interruptions (calls, notifications)
- [ ] Data persists across launches
```

#### Performance Benchmarks
- [ ] Model loads in < 30 seconds on first launch
- [ ] Response generation < 5 seconds average
- [ ] Memory usage stays < 500MB during conversation
- [ ] Battery drain acceptable (<10% per hour of use)
- [ ] No thermal throttling during normal use

### 3. Privacy & Compliance

#### Privacy Manifest
Create `PrivacyInfo.xcprivacy` in project root:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>NSPrivacyAccessedAPITypes</key>
    <array>
        <dict>
            <key>NSPrivacyAccessedAPIType</key>
            <string>NSPrivacyAccessedAPICategoryMicrophone</string>
            <key>NSPrivacyAccessedAPITypeReasons</key>
            <array>
                <string>For Spanish pronunciation practice</string>
            </array>
        </dict>
    </array>
    <key>NSPrivacyCollectedDataTypes</key>
    <array>
        <dict>
            <key>NSPrivacyCollectedDataType</key>
            <string>NSPrivacyCollectedDataTypeAudioData</string>
            <key>NSPrivacyCollectedDataTypeLinked</key>
            <false/>
            <key>NSPrivacyCollectedDataTypeTracking</key>
            <false/>
            <key>NSPrivacyCollectedDataTypePurposes</key>
            <array>
                <string>Speech recognition for language learning</string>
            </array>
        </dict>
    </array>
</dict>
</plist>
```

#### Info.plist Verification
Ensure these keys are present:
- [x] `NSMicrophoneUsageDescription`
- [x] `NSSpeechRecognitionUsageDescription`
- [x] `ITSAppUsesNonExemptEncryption` = false
- [x] `LSApplicationCategoryType` = education

#### Privacy Policy (Required)

Create a privacy policy that covers:
1. **Data Collection**: What data is collected (voice recordings for transcription)
2. **Data Usage**: How data is used (on-device processing only)
3. **Data Storage**: Where data is stored (locally on device)
4. **Third-Party Sharing**: Who data is shared with (none)
5. **User Rights**: How users can delete their data (uninstall app)
6. **Contact**: How to reach you with privacy concerns

Example structure:
```markdown
# Soltura Privacy Policy

Last Updated: [Date]

## Introduction
Soltura ("we," "our," or "us") respects your privacy. This policy explains how we handle your data.

## Data Collection
- Voice recordings (processed locally, not stored)
- Conversation history (stored locally on your device)
- User preferences (stored locally)
- Anki deck data (if imported, stored locally)

## Data Processing
All AI processing happens on your device. Your conversations NEVER leave your iPhone.

## Data Storage
- All data is stored locally on your device
- We do not have access to your data
- No cloud storage or backups are created by us

## Data Sharing
We do not share, sell, or transmit your data to any third parties.

## Your Rights
- Delete all data by uninstalling the app
- No account creation required
- No tracking or analytics

## Contact
For privacy questions: privacy@soltura.app
```

Host this on:
- GitHub Pages (free)
- Your own website
- Notion (public page)

## Phase 3: App Store Connect Setup

### 1. Create App Listing

Log into [App Store Connect](https://appstoreconnect.apple.com)

- [ ] Click "My Apps" → "+" → "New App"
- [ ] Platform: iOS
- [ ] Name: "Soltura - Spanish Practice"
- [ ] Primary Language: English (US)
- [ ] Bundle ID: Select your registered identifier
- [ ] SKU: soltura-ios-001
- [ ] User Access: Full Access

### 2. App Information

**Basic Info:**
- [ ] **Name**: Soltura - Spanish Practice
- [ ] **Subtitle**: AI-Powered Conversational Learning (30 char limit)
- [ ] **Category**: Primary: Education, Secondary: Productivity
- [ ] **Content Rights**: Own all rights

**Age Rating:**
Answer the questionnaire:
- Contests: No
- Gambling: No
- Violence: None
- Sexual Content: None
- Profanity: None
- Horror/Fear: None
- Mature/Suggestive: None
- Alcohol/Tobacco/Drugs: None
- Medical/Treatment: No
- **Result**: 4+ rating

### 3. Pricing & Availability

**Pricing:**
Choose your monetization strategy:

Option 1: Paid App
- [ ] Price Tier: Select (e.g., $9.99 = Tier 10)
- [ ] Available in all territories

Option 2: Free with IAP
- [ ] Price: Free
- [ ] Create In-App Purchases:
  - Premium Monthly: $4.99
  - Premium Yearly: $39.99 (save 33%)
  - Lifetime: $49.99

**Availability:**
- [ ] Available in all countries
- [ ] Pre-order: Optional (if you want to build hype)

### 4. App Privacy

In App Store Connect, declare your privacy practices:

**Data Collection:**
- [ ] **Audio Data**: Yes
  - Used for: App Functionality
  - Linked to User: No
  - Used for Tracking: No

- [ ] **Product Interaction**: Yes (conversation history)
  - Used for: App Functionality
  - Linked to User: No
  - Used for Tracking: No

- [ ] **Other Data Types**: No

**Privacy Policy URL:**
- [ ] Enter your hosted privacy policy URL

### 5. App Review Information

**Contact Information:**
- [ ] First Name: [Your Name]
- [ ] Last Name: [Your Last Name]
- [ ] Phone: [Your Phone]
- [ ] Email: [Your Email]

**Demo Account:**
Not required (no login needed)

**Notes:**
```
Soltura is an AI-powered Spanish conversation practice app that runs entirely on-device.

IMPORTANT NOTES FOR REVIEW:
1. The app requires microphone permission for voice practice (Spanish speech recognition)
2. All AI processing happens locally - no internet required after initial model download
3. First launch may take 30-60 seconds to load the AI model (this is normal)
4. The AI uses a quantized language model for Spanish conversation

TEST INSTRUCTIONS:
1. Grant microphone and speech recognition permissions when prompted
2. Select any proficiency level (recommend "A1 - Beginner" for testing)
3. Tap "Start Conversation"
4. Wait for model to load (progress shown)
5. Type a message in Spanish or English
6. The AI will respond in Spanish
7. Test voice input by tapping and holding the microphone button

SAMPLE CONVERSATIONS:
- "Hola, ¿cómo estás?"
- "Me gusta la comida española"
- "¿Qué tiempo hace hoy?"

Please allow extra time for the initial model load. Thank you!
```

**Attachment:**
- [ ] Upload a demo video (optional but helpful)

## Phase 4: Screenshots & Previews

### Required Screenshot Sizes

You need screenshots for:
- **6.7" Display** (iPhone 15 Pro Max, 14 Pro Max): 1290 x 2796 px
- **6.5" Display** (iPhone 11 Pro Max, XS Max): 1242 x 2688 px
- **5.5" Display** (iPhone 8 Plus): 1242 x 2208 px

### Screenshot Composition (Minimum 3, Maximum 10)

**Screenshot 1: Setup Screen**
- Show proficiency level selection
- Highlight "Adaptive AI" feature
- Caption: "Choose your Spanish level - or let AI adapt to you"

**Screenshot 2: Conversation**
- Show an active conversation in Spanish
- Display both user and AI messages
- Caption: "Practice natural Spanish conversation"

**Screenshot 3: Voice Feature**
- Show microphone button active
- Speech recognition in progress
- Caption: "Speak Spanish - get instant feedback"

**Screenshot 4: Tutor Panel**
- Show grammar explanations
- Display translation
- Caption: "Your AI tutor explains grammar in real-time"

**Screenshot 5: Anki Integration**
- Show Anki stats
- Vocabulary scaffolding
- Caption: "Import your Anki decks for personalized practice"

**Screenshot 6: Scenarios**
- Show scenario selection
- Different categories
- Caption: "50+ real-world scenarios to practice"

### Creating Screenshots

**Option 1: Xcode Simulator**
```bash
# Run app in simulator
# Take screenshots: Cmd+S
# Screenshots saved to Desktop
```

**Option 2: Device Screenshots**
```bash
# Run on physical device
# Take screenshot: Volume Up + Power
# Transfer via AirDrop or Finder
```

**Option 3: Screenshots with Marketing (Recommended)**
Use tools to add device frames and captions:
- [App Screenshot Maker](https://appscreenshotmaker.com)
- [Previewed](https://previewed.app)
- [Figma + Device Mockups](https://www.figma.com)

### App Preview Video (Optional)

30-second video showing:
1. (0-5s) App icon and name
2. (5-10s) Quick setup process
3. (10-20s) Voice conversation in action
4. (20-25s) Tutor feedback panel
5. (25-30s) End card: "Practice Spanish naturally"

Tools:
- iMovie (free)
- Final Cut Pro
- Screen recording with voiceover

## Phase 5: App Description

### App Name & Subtitle
- **Name**: Soltura - Spanish Practice
- **Subtitle**: AI Tutor for Conversation

### Keywords (100 characters max)
```
spanish,learn spanish,conversation,ai tutor,practice spanish,speak spanish,anki,language learning
```

### Promotional Text (170 characters, updatable without review)
```
New in v1.0: 50+ conversation scenarios, Anki integration, and adaptive AI that matches your Spanish level. Practice naturally, gain fluency!
```

### Description (4000 characters max)

See README.md for full description template. Key points:
- Lead with main benefit (practice Spanish naturally)
- Bullet points for features
- Social proof (if available)
- Clear call-to-action
- Mention "privacy first" approach
- List requirements clearly

### What's New (4000 characters)
```
Version 1.0 - Initial Release

Welcome to Soltura! Practice conversational Spanish with AI - completely on your device.

🎉 FEATURES:
• Adaptive AI that matches your Spanish level
• 50+ real-world conversation scenarios
• Import your Anki decks for personalized practice
• Voice recognition for pronunciation practice
• AI tutor with real-time grammar feedback
• Completely private - all processing on your device

We'd love your feedback! Rate the app and let us know how we can improve.

¡Vamos a practicar! 🇪🇸
```

## Phase 6: Build & Upload

### 1. Prepare for Archive

**Clean Build:**
```bash
# In Xcode
Product → Clean Build Folder (Shift+Cmd+K)
```

**Version & Build:**
- [ ] Set Version: 1.0
- [ ] Set Build: 1

**Signing:**
- [ ] Automatic signing enabled
- [ ] Team selected
- [ ] Certificate valid

### 2. Archive the App

```bash
# In Xcode
1. Select "Any iOS Device (arm64)" as destination
2. Product → Archive
3. Wait for build to complete (shows in Organizer)
```

### 3. Validate Archive

In Organizer:
- [ ] Select your archive
- [ ] Click "Validate App"
- [ ] Wait for validation
- [ ] Fix any errors reported

Common validation errors:
- Missing icons → Add all required sizes
- Invalid bundle ID → Check signing settings
- Missing permissions → Verify Info.plist

### 4. Upload to App Store Connect

- [ ] Click "Distribute App"
- [ ] Select "App Store Connect"
- [ ] Choose "Upload"
- [ ] Wait for processing (10-30 minutes)
- [ ] Verify build appears in App Store Connect

### 5. Select Build for Release

In App Store Connect:
- [ ] Go to your app
- [ ] Click version "1.0"
- [ ] Scroll to "Build"
- [ ] Click "Select a build"
- [ ] Choose your uploaded build
- [ ] Wait for processing to complete

## Phase 7: Submit for Review

### Final Checklist

**App Store Connect:**
- [ ] All required fields filled
- [ ] Screenshots uploaded (all sizes)
- [ ] Description proofread
- [ ] Privacy policy linked
- [ ] Age rating set
- [ ] Pricing configured
- [ ] Build selected

**Testing:**
- [ ] App works on device
- [ ] No crashes in 30-minute session
- [ ] All features functional
- [ ] Voice recognition works
- [ ] Model loads successfully

**Legal:**
- [ ] Privacy policy published
- [ ] Terms of service (if applicable)
- [ ] Content rights verified

### Submit

- [ ] Click "Submit for Review"
- [ ] Answer additional questions if prompted
- [ ] Confirm submission

### Status Progression

1. **Waiting for Review** (1-3 days typically)
2. **In Review** (24-48 hours)
3. **Pending Developer Release** (if you chose manual release)
4. **Ready for Sale** 🎉

### If Rejected

Common rejection reasons and fixes:

**Rejection: Crashes**
- Fix: Test thoroughly, submit crash logs, resubmit

**Rejection: Missing functionality**
- Fix: Ensure LLM model actually works (not simulation)

**Rejection: Privacy concerns**
- Fix: Clarify on-device processing in notes
- Add more detail to privacy policy

**Rejection: Microphone usage unclear**
- Fix: Update usage description to be more specific

**After fixing:**
- [ ] Make required changes
- [ ] Archive and upload new build
- [ ] Reply to Apple in Resolution Center
- [ ] Resubmit for review

## Phase 8: Post-Approval

### Launch Day

- [ ] Monitor crash reports in Xcode Organizer
- [ ] Respond to user reviews
- [ ] Share on social media
- [ ] Post on relevant subreddits (r/Spanish, r/languagelearning)
- [ ] Reach out to language learning blogs

### Week 1

- [ ] Monitor analytics in App Store Connect
- [ ] Check user feedback
- [ ] Plan first update based on feedback
- [ ] Start working on v1.1 features

### Marketing Ideas

1. **Social Media**:
   - Demo video on Twitter/X
   - Instagram Reels showing voice interaction
   - TikTok demonstrating quick conversations

2. **Content Marketing**:
   - Blog post: "How I built an on-device Spanish AI tutor"
   - Technical deep-dive for developers
   - Language learning tips for users

3. **Communities**:
   - Post in r/Spanish
   - Share in language learning Discord servers
   - Reach out to Spanish teachers on Twitter

4. **ASO (App Store Optimization)**:
   - Monitor keyword rankings
   - A/B test screenshots
   - Update promotional text monthly
   - Encourage positive reviews

## Resources

**Apple Documentation:**
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

**Tools:**
- [App Screenshot Maker](https://appscreenshotmaker.com)
- [App Icon Generator](https://appicon.co)
- [Privacy Policy Generator](https://www.freeprivacypolicy.com/free-privacy-policy-generator/)

**Communities:**
- [r/iOSProgramming](https://reddit.com/r/iOSProgramming)
- [Swift Forums](https://forums.swift.org)
- [Indie Hackers](https://indiehackers.com)

## Support

If you encounter issues during submission:
- Check Apple Developer Forums
- Review App Store Review Guidelines
- Contact Apple Developer Support (requires paid account)
- Ask in iOS development communities

---

Good luck with your submission! 🚀

Remember: First submission is always the hardest. Once approved, updates are much faster (usually 24-48 hours).

¡Éxito! 🎉
