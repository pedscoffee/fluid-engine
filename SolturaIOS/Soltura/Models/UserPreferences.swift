//
//  UserPreferences.swift
//  Soltura
//
//  User preferences and conversation settings
//

import Foundation

enum ProficiencyLevel: String, CaseIterable, Codable {
    case auto = "Auto"
    case a1 = "A1"
    case a2 = "A2"
    case b1 = "B1"
    case b2 = "B2"
    case c1 = "C1"
    case c2 = "C2"
    case native = "Native"

    var displayName: String {
        switch self {
        case .auto: return "Auto"
        case .a1: return "A1 - Beginner"
        case .a2: return "A2 - Elementary"
        case .b1: return "B1 - Intermediate"
        case .b2: return "B2 - Upper Intermediate"
        case .c1: return "C1 - Advanced"
        case .c2: return "C2 - Proficient"
        case .native: return "Native"
        }
    }
}

enum GrammarFocus: String, CaseIterable, Codable {
    case present = "present"
    case preterite = "preterite"
    case imperfect = "imperfect"
    case future = "future"
    case subjunctive = "subjunctive"

    var displayName: String {
        switch self {
        case .present: return "Presente"
        case .preterite: return "Pretérito"
        case .imperfect: return "Imperfecto"
        case .future: return "Futuro"
        case .subjunctive: return "Subjuntivo"
        }
    }
}

enum TutorPreset: String, CaseIterable, Codable {
    case translation = "translation"
    case grammar = "grammar"
    case verbs = "verbs"
    case vocabulary = "vocabulary"
    case mistakes = "mistakes"
    case custom = "custom"

    var displayName: String {
        switch self {
        case .translation: return "Translation Only"
        case .grammar: return "Grammar Explanations"
        case .verbs: return "Irregular Verbs"
        case .vocabulary: return "Vocabulary Building"
        case .mistakes: return "Common Mistakes"
        case .custom: return "Custom"
        }
    }
}

struct UserPreferences: Codable {
    var proficiencyLevel: ProficiencyLevel = .auto
    var targetVocabulary: [String] = []
    var grammarFocus: Set<GrammarFocus> = []
    var selectedScenario: String = ""
    var customGoal: String = ""
    var tutorPreset: TutorPreset = .translation
    var tutorCustomInstruction: String = ""
    var tutorLanguage: String = "english" // "english" or "spanish"
    var darkMode: Bool = false
    var voiceMuted: Bool = false
    var selectedVoice: String = ""

    // Anki integration
    var ankiVocabulary: [AnkiCard] = []

    func hasAnkiData() -> Bool {
        return !ankiVocabulary.isEmpty
    }

    func getAnkiStats() -> (mastered: Int, familiar: Int, learning: Int, new: Int) {
        var stats = (mastered: 0, familiar: 0, learning: 0, new: 0)
        for card in ankiVocabulary {
            switch card.masteryLevel {
            case .mastered:
                stats.mastered += 1
            case .familiar:
                stats.familiar += 1
            case .learning:
                stats.learning += 1
            case .new:
                stats.new += 1
            }
        }
        return stats
    }
}

enum MasteryLevel: String, Codable {
    case mastered
    case familiar
    case learning
    case new
}

struct AnkiCard: Codable, Identifiable {
    let id = UUID()
    let front: String
    let back: String
    let masteryLevel: MasteryLevel
    let interval: Int // days

    init(front: String, back: String, interval: Int) {
        self.front = front
        self.back = back
        self.interval = interval

        // Determine mastery level based on interval
        if interval >= 180 {
            self.masteryLevel = .mastered
        } else if interval >= 21 {
            self.masteryLevel = .familiar
        } else if interval >= 7 {
            self.masteryLevel = .learning
        } else {
            self.masteryLevel = .new
        }
    }

    init(front: String, back: String, masteryLevel: MasteryLevel) {
        self.front = front
        self.back = back
        self.masteryLevel = masteryLevel

        // Set default interval based on mastery level
        switch masteryLevel {
        case .mastered:
            self.interval = 180
        case .familiar:
            self.interval = 30
        case .learning:
            self.interval = 14
        case .new:
            self.interval = 1
        }
    }
}
