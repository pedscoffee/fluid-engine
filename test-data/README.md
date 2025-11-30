# Anki Integration Test Data

This directory contains test files to validate the Anki spaced repetition integration in Soltura.

## Quick Start

### Option 1: Use Pre-made TSV Files (Easiest)

The simplest way to test is using the TSV files:

1. Open Soltura in your browser
2. In the setup screen, find the "Anki Spaced Repetition Integration" section
3. Click **"Import TSV/Text"**
4. Select one of the TSV files:
   - `spanish-mastered.txt` - 30 basic words (import as "Mastered")
   - `spanish-learning.txt` - 23 intermediate words (import as "Learning")
   - `spanish-new.txt` - 16 advanced words (import as "New")
5. Choose the appropriate mastery level in the modal
6. View the statistics to confirm import

**Recommended test sequence:**
1. Import `spanish-mastered.txt` as "Mastered"
2. Import `spanish-learning.txt` as "Learning"
3. Import `spanish-new.txt` as "New"
4. Check that the stats show: 30 mastered, 23 learning, 16 new

### Option 2: Generate APKG Files with Realistic Data (Complete Testing)

For more comprehensive testing with actual Anki scheduling data:

1. Open `generate-apkg.html` in your browser
2. Click the buttons to generate test decks:
   - **Beginner's Spanish**: 50 cards across all mastery levels
   - **Intermediate Spanish**: 40 cards, mostly mastered/familiar
   - **New Learner Spanish**: 30 cards, mostly new/learning
3. The APKG files will download automatically
4. In Soltura, click **"Import APKG"** and select the downloaded files

## Test Deck Details

### Beginner's Spanish (Mixed Levels)
**Total:** 50 cards
- **Mastered (15):** Basic vocabulary like "hola", "casa", "agua" (intervals: 110-300 days)
- **Familiar (15):** Common verbs and nouns (intervals: 35-70 days)
- **Learning (12):** Useful phrases and conjunctions (intervals: 8-19 days)
- **New (8):** Recently added intermediate vocabulary (intervals: 1-6 days)

**Best for:** Testing mixed mastery level handling and vocabulary scaffolding

### Intermediate Spanish (Well-Studied)
**Total:** 40 cards
- **Mastered (20):** Well-practiced intermediate vocabulary (intervals: 120-210 days)
- **Familiar (15):** Recent but comfortable words (intervals: 35-62 days)
- **Learning (5):** New intermediate concepts (intervals: 10-18 days)

**Best for:** Testing a user who has been studying consistently

### New Learner Spanish (Mostly New)
**Total:** 30 cards
- **Mastered (5):** Only basic greetings (intervals: 110-200 days)
- **Familiar (5):** Simple common words (intervals: 38-52 days)
- **Learning (10):** Basic vocabulary being learned (intervals: 8-18 days)
- **New (10):** Recently added basics (intervals: 1-6 days)

**Best for:** Testing beginner user experience with minimal mastered vocabulary

## Expected Behavior After Import

After importing test data, you should observe:

1. **Statistics Display**
   - The Anki stats panel should become visible
   - Card counts should match the imported data
   - Color-coded mastery levels (green=mastered, blue=familiar, orange=learning, red=new)

2. **Conversation Scaffolding**
   - Click "Start Conversation"
   - The AI should receive a system prompt containing:
     - Sample words from each mastery category
     - Instructions to use mastered/familiar words as scaffolding
     - Guidance to introduce new words carefully

3. **Prompt Inspection** (for debugging)
   - Open browser console
   - The system prompt sent to the AI includes the "ANKI VOCABULARY SCAFFOLDING" section
   - You should see sampled words from each mastery level

## Testing Scenarios

### Scenario 1: Complete Beginner
```
1. Import: spanish-mastered.txt as "New"
2. Import: spanish-learning.txt as "New"
3. Expected: All ~53 words categorized as "New"
4. AI should introduce vocabulary very carefully with lots of context
```

### Scenario 2: Balanced Learner
```
1. Import: Beginner's Spanish (Mixed Levels).apkg
2. Expected: Balanced distribution across all levels
3. AI should use mastered words frequently, scaffold learning words
```

### Scenario 3: Advanced Learner
```
1. Import: spanish-mastered.txt as "Mastered"
2. Import: spanish-learning.txt as "Familiar"
3. Import: spanish-new.txt as "Learning"
4. Expected: Strong foundation (53 mastered/familiar), 16 challenging
5. AI should speak freely using most vocabulary
```

### Scenario 4: Multiple Deck Import
```
1. Generate all 3 APKG files
2. Import all three into Soltura
3. Expected: Combined vocabulary with best intervals preserved
4. Test that duplicate words take the longest interval
```

## Validation Checklist

- [ ] TSV import shows mastery level selection modal
- [ ] APKG import shows progress indicator
- [ ] Statistics panel displays after import
- [ ] Card counts are accurate
- [ ] Mastery level distribution is correct
- [ ] "Clear Anki Data" button removes all data
- [ ] Multiple imports combine vocabulary correctly
- [ ] Conversation prompt includes vocabulary guidance
- [ ] AI uses mastered words more frequently than new words
- [ ] Data persists after page reload (localStorage)

## Troubleshooting

**Import fails with APKG files:**
- Ensure sql.js and JSZip are loaded (check browser console)
- Try generating a fresh APKG using generate-apkg.html
- Verify the APKG file is valid (test with Anki desktop app)

**Statistics don't update:**
- Check browser console for JavaScript errors
- Verify localStorage is enabled
- Try clearing Anki data and re-importing

**Words not appearing in prompt:**
- Generate a conversation and check console for system prompt
- Verify vocabulary guidance section is present
- Check that mastery categories have words

## File Formats

### TSV Format
```
spanish_word<TAB>english_translation
```

### APKG Format
- ZIP file containing:
  - `collection.anki21` - SQLite database
  - `media` - Media file mappings (empty for these tests)

## License

These test files contain common Spanish vocabulary and are provided for testing purposes only.
