//
//  AnkiManager.swift
//  Soltura
//
//  Manages Anki deck imports and vocabulary tracking
//

import Foundation
import UniformTypeIdentifiers

class AnkiManager: ObservableObject {
    @Published var vocabulary: [AnkiCard] = []
    @Published var isImporting = false
    @Published var importError: String?

    // MARK: - Import from TSV/CSV

    func importFromTSV(url: URL, masteryLevel: MasteryLevel) throws {
        guard url.startAccessingSecurityScopedResource() else {
            throw AnkiError.accessDenied
        }
        defer { url.stopAccessingSecurityScopedResource() }

        let content = try String(contentsOf: url, encoding: .utf8)
        let lines = content.components(separatedBy: .newlines)

        var cards: [AnkiCard] = []

        for line in lines {
            let trimmed = line.trimmingCharacters(in: .whitespaces)
            guard !trimmed.isEmpty else { continue }

            // Handle both TSV and CSV
            let components = trimmed.contains("\t")
                ? trimmed.components(separatedBy: "\t")
                : trimmed.components(separatedBy: ",")

            guard components.count >= 2 else { continue }

            let front = components[0].trimmingCharacters(in: .whitespaces)
            let back = components[1].trimmingCharacters(in: .whitespaces)

            cards.append(AnkiCard(front: front, back: back, masteryLevel: masteryLevel))
        }

        DispatchQueue.main.async {
            self.vocabulary.append(contentsOf: cards)
        }
    }

    // MARK: - Import from APKG (Anki Package)

    func importFromAPKG(url: URL) throws {
        // APKG files are ZIP archives containing:
        // - collection.anki21 or collection.anki2 (SQLite database)
        // - media file mappings
        //
        // For a complete implementation, you would:
        // 1. Unzip the APKG file
        // 2. Parse the SQLite database
        // 3. Extract cards with scheduling information
        // 4. Calculate mastery levels from intervals
        //
        // This requires additional dependencies:
        // - ZIPFoundation or similar for unzipping
        // - SQLite.swift for database parsing
        //
        // For now, we'll provide a stub that users can enhance

        throw AnkiError.apkgNotImplemented
    }

    // MARK: - Statistics

    func getStatistics() -> (mastered: Int, familiar: Int, learning: Int, new: Int, total: Int) {
        let mastered = vocabulary.filter { $0.masteryLevel == .mastered }.count
        let familiar = vocabulary.filter { $0.masteryLevel == .familiar }.count
        let learning = vocabulary.filter { $0.masteryLevel == .learning }.count
        let new = vocabulary.filter { $0.masteryLevel == .new }.count

        return (mastered, familiar, learning, new, vocabulary.count)
    }

    // MARK: - Clear Data

    func clearVocabulary() {
        vocabulary = []
    }

    // MARK: - Persistence

    func saveToUserDefaults() {
        if let encoded = try? JSONEncoder().encode(vocabulary) {
            UserDefaults.standard.set(encoded, forKey: "ankiVocabulary")
        }
    }

    func loadFromUserDefaults() {
        if let data = UserDefaults.standard.data(forKey: "ankiVocabulary"),
           let decoded = try? JSONDecoder().decode([AnkiCard].self, from: data) {
            vocabulary = decoded
        }
    }
}

// MARK: - Errors

enum AnkiError: LocalizedError {
    case accessDenied
    case invalidFormat
    case apkgNotImplemented

    var errorDescription: String? {
        switch self {
        case .accessDenied:
            return "Unable to access the selected file"
        case .invalidFormat:
            return "Invalid file format. Please use a TSV or CSV file."
        case .apkgNotImplemented:
            return "APKG import is not yet implemented. Please export your Anki deck as TSV (File > Export > Notes in Plain Text)"
        }
    }
}

// MARK: - APKG Implementation Notes
/*
 To fully implement APKG import, you need to:

 1. Add ZIPFoundation dependency to Package.swift:
    .package(url: "https://github.com/weichsel/ZIPFoundation.git", from: "0.9.0")

 2. Add SQLite.swift for database parsing:
    .package(url: "https://github.com/stephencelis/SQLite.swift.git", from: "0.14.0")

 3. Implement the APKG parser:
    - Unzip the .apkg file
    - Open collection.anki21 (SQLite database)
    - Query the 'cards' and 'notes' tables
    - Extract scheduling data (ivl field = interval in days)
    - Map intervals to mastery levels:
      * ivl >= 180 days: mastered
      * ivl >= 21 days: familiar
      * ivl >= 7 days: learning
      * ivl < 7 days: new

 4. Example SQL query structure:
    SELECT notes.flds, cards.ivl
    FROM cards
    JOIN notes ON cards.nid = notes.id
    WHERE cards.queue >= 0  -- Only include active cards

 5. Parse the flds (fields) column which contains tab-separated values
    for the front and back of each card
 */
