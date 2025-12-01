//
//  PromptBuilder.swift
//  Soltura
//
//  Builds system prompts for Spanish conversation AI
//

import Foundation

class PromptBuilder {
    private let preferences: UserPreferences

    init(preferences: UserPreferences) {
        self.preferences = preferences
    }

    func build() -> String {
        var prompt = Templates.baseRole + "\n\n"

        // 1. Difficulty Level
        let level = preferences.proficiencyLevel
        let levelDescription = Templates.difficultyLevels[level.rawValue] ?? Templates.difficultyLevels["Auto"]!

        prompt += "CURRENT DIFFICULTY LEVEL: \(level.rawValue)\n"
        prompt += "\(levelDescription)\n\n"

        // 2. Anki Vocabulary Scaffolding
        if !preferences.ankiVocabulary.isEmpty {
            let stats = preferences.getAnkiStats()
            prompt += buildAnkiSection(stats: stats)
        }

        // 3. Target Vocabulary
        if !preferences.targetVocabulary.isEmpty {
            prompt += "TARGET VOCABULARY:\n"
            prompt += "Try to naturally include the following words/phrases in your responses: \(preferences.targetVocabulary.joined(separator: ", "))\n\n"
        }

        // 4. Grammar Focus
        if !preferences.grammarFocus.isEmpty {
            prompt += "GRAMMAR FOCUS:\n"
            prompt += "Prioritize using or eliciting the following grammar concepts:\n"
            for grammar in preferences.grammarFocus {
                prompt += "- \(grammar.displayName)\n"
            }
            prompt += "\n"
        }

        // 5. Scenario or Custom Goal
        if !preferences.selectedScenario.isEmpty {
            if let scenario = ScenarioData.getScenario(byId: preferences.selectedScenario) {
                prompt += "CONVERSATION SCENARIO (HIGH PRIORITY):\n"
                prompt += "\(scenario.instruction)\n\n"
            }
        } else if !preferences.customGoal.isEmpty {
            prompt += "USER CUSTOM REQUEST (PRIORITY):\n"
            prompt += "The user specifically asked: \"\(preferences.customGoal)\".\n"
            prompt += "ADAPT YOUR CONVERSATION TO FULFILL THIS REQUEST ABOVE ALL ELSE.\n\n"
        }

        // General Rules
        prompt += "IMPORTANT RULES:\n"
        prompt += "1. Speak ONLY in Spanish. No English unless requested.\n"
        prompt += "2. Keep responses concise (1-3 sentences) to encourage a back-and-forth dialogue.\n"
        prompt += "3. REFLECTIVE FEEDBACK: If the user makes a mistake, rephrase it correctly in your response naturally, or ask a clarifying question. Do not lecture.\n"

        return prompt
    }

    private func buildAnkiSection(stats: (mastered: Int, familiar: Int, learning: Int, new: Int)) -> String {
        var section = "ANKI VOCABULARY SCAFFOLDING:\n"
        section += "The user has imported their Anki deck data. Use this to create an optimal learning experience:\n\n"

        let mastered = preferences.ankiVocabulary.filter { $0.masteryLevel == .mastered }
        let familiar = preferences.ankiVocabulary.filter { $0.masteryLevel == .familiar }
        let learning = preferences.ankiVocabulary.filter { $0.masteryLevel == .learning }
        let new = preferences.ankiVocabulary.filter { $0.masteryLevel == .new }

        // Mastered words
        if !mastered.isEmpty {
            let sample = sampleWords(from: mastered, count: 15)
            section += "MASTERED WORDS (use freely - these are well-known to the user):\n"
            section += "\(sample.map { $0.front }.joined(separator: ", "))\n"
            if mastered.count > 15 {
                section += "...and \(mastered.count - 15) more mastered words\n"
            }
            section += "\n"
        }

        // Familiar words
        if !familiar.isEmpty {
            let sample = sampleWords(from: familiar, count: 15)
            section += "FAMILIAR WORDS (comfortable for the user - use to support learning):\n"
            section += "\(sample.map { $0.front }.joined(separator: ", "))\n"
            if familiar.count > 15 {
                section += "...and \(familiar.count - 15) more familiar words\n"
            }
            section += "\n"
        }

        // Learning words
        if !learning.isEmpty {
            let sample = sampleWords(from: learning, count: 12)
            section += "CURRENTLY LEARNING (use these more frequently to reinforce):\n"
            section += "\(sample.map { $0.front }.joined(separator: ", "))\n"
            if learning.count > 12 {
                section += "...and \(learning.count - 12) more learning words\n"
            }
            section += "\n"
        }

        // New words
        if !new.isEmpty {
            let sample = sampleWords(from: new, count: 10)
            section += "NEW/CHALLENGING WORDS (introduce carefully with familiar word support):\n"
            section += "\(sample.map { $0.front }.joined(separator: ", "))\n"
            if new.count > 10 {
                section += "...and \(new.count - 10) more new words\n"
            }
            section += "\n"
        }

        section += "SCAFFOLDING STRATEGY:\n"
        section += "- Build sentences using MASTERED and FAMILIAR words as the foundation\n"
        section += "- Naturally incorporate LEARNING words to reinforce retention\n"
        section += "- Introduce NEW words in context with lots of familiar vocabulary support\n"
        section += "- Create connections between new words and words the user already knows well\n"
        section += "- This approach maximizes comprehension while gently expanding vocabulary\n\n"

        return section
    }

    private func sampleWords(from cards: [AnkiCard], count: Int) -> [AnkiCard] {
        if cards.count <= count {
            return cards
        }

        var result = Array(cards.prefix(count))
        for i in count..<cards.count {
            let j = Int.random(in: 0...i)
            if j < count {
                result[j] = cards[i]
            }
        }
        return result
    }
}

// MARK: - Templates

struct Templates {
    static let baseRole = "You are a friendly, patient, and encouraging native Spanish tutor. Your goal is to help the user practice conversational Spanish. You should maintain a natural conversation flow while subtly guiding them to practice specific topics if requested. Never lecture. Always keep the conversation going with relevant follow-up questions."

    static let difficultyLevels: [String: String] = [
        "Auto": """
**ADAPTIVE DIFFICULTY MODE - Dynamic Level Matching:**

Your primary task is to ANALYZE and MIRROR the user's demonstrated Spanish proficiency in real-time. This is a dynamic, conversation-by-conversation adaptation system.

**Analysis Framework - Evaluate Each User Message For:**

1. **Grammar Complexity:**
   - Which verb tenses are they using? (present only, past tenses, subjunctive, conditionals?)
   - Sentence structure complexity (simple SVO, compound, subordinate clauses?)
   - Error patterns (consistent vs random, which structures cause problems?)

2. **Vocabulary Sophistication:**
   - Basic vs advanced word choices?
   - Topic-specific vocabulary usage?
   - Reliance on cognates vs native Spanish words?

3. **Fluency Indicators:**
   - Message length and elaboration
   - Confidence in expression (hesitations, corrections, code-switching?)
   - Ability to express nuanced ideas

**Adaptive Response Strategy:**

- **MIRROR their demonstrated level** in your responses
- If they use present tense only → respond with present tense, simple structures
- If they use past tenses → incorporate similar past tense complexity
- If they attempt subjunctive → validate with subjunctive use, but keep it accessible
- If they write short, simple sentences → match with similar brevity
- If they elaborate with complex ideas → respond with equivalent complexity

**Dynamic Adjustment Rules:**

- Start neutral (B1-level) in your first response, then adapt immediately
- Each message is a new data point - continuously recalibrate
- Stay within ±1 level of their demonstrated proficiency
- Introduce slightly more advanced structures occasionally (10-20% above their level) to encourage growth, but not overwhelm
- If user makes errors, gently model correct forms without explicit correction
- Adapt vocabulary density to match theirs

**Key Principle:** You are a conversational mirror that matches their energy, complexity, and proficiency while subtly guiding them upward. Think "meet them where they are, then gently pull them forward."
""",

        "A1": """
**LLM Output Guidelines:**
- Use only present tense (regular and high-frequency irregulars: ser, estar, tener, ir)
- Keep sentences simple: subject-verb-object order
- Use basic vocabulary with clear noun-adjective agreement
- Employ simple questions with common question words (qué, quién, dónde, cuándo)
- Stick to concrete, present-time topics
- Avoid compound sentences; use mainly "y" and "pero" for connecting ideas
- Use reflexive verbs only for daily routines (levantarse, ducharse)
""",

        "A2": """
**LLM Output Guidelines:**
- Introduce past tense (pretérito and imperfecto) and simple future (ir a + infinitive)
- Use direct and indirect object pronouns in straightforward contexts
- Employ comparatives (más/menos que) and basic superlatives
- Include reflexive verbs more broadly
- Create slightly longer sentences with porque, cuando, después
- Discuss familiar topics in present, past, and near future
- Keep subjunctive minimal or absent
""",

        "B1": """
**LLM Output Guidelines:**
- Mix present, preterite, imperfect, and present perfect naturally
- Introduce present subjunctive in common contexts (espero que, es importante que)
- Use commands (imperative) appropriately
- Combine direct/indirect object pronouns (se lo, se la)
- Employ relative pronouns (que, quien) and time connectors (aunque, mientras, antes de)
- Discuss abstract topics with cause-effect relationships
- Begin conditional sentences (Si estudias, aprobarás)
""",

        "B2": """
**LLM Output Guidelines:**
- Use all past tenses (preterite, imperfect, present perfect, pluperfect) with nuance
- Employ imperfect subjunctive in hypothetical clauses (Si tuviera…, me gustaría que…)
- Use conditional tenses (simple and perfect) for speculation and politeness
- Include passive voice (ser + past participle) and impersonal "se"
- Create complex sentences with subordinate clauses
- Use advanced connectors (sin embargo, por lo tanto, a pesar de que)
- Express subtle differences in mood and register
""",

        "C1": """
**LLM Output Guidelines:**
- Master all subjunctive forms (present, imperfect, perfect, pluperfect) with precision
- Shift between indicative and subjunctive to convey stance, certainty, or nuance
- Use complex temporal relationships and aspectual periphrases
- Employ sophisticated discourse markers for cohesion
- Create long, multi-clause sentences with embedded structures
- Use idiomatic expressions, collocations, and register-appropriate language
- Handle hypothetical past situations (Si hubiera sabido, habría venido)
""",

        "C2": """
**LLM Output Guidelines:**
- Demonstrate complete command of all grammatical structures
- Use grammar choices for stylistic effect and subtle meaning distinctions
- Employ nominalizations and reduced clauses for elegant expression
- Navigate formal/informal registers seamlessly
- Use advanced passive constructions and "se" variations appropriately
- Include specialized vocabulary and complex syntax naturally
- Express ideas with precision, fluidity, and near-native nuance
""",

        "Native": """
**Native Speaker Mode - No Constraints:**
Speak naturally as a native Spanish speaker would in casual conversation. No restrictions on grammar, vocabulary, complexity, or style. Express yourself freely and authentically without simplification or pedagogical modifications.
"""
    ]
}
