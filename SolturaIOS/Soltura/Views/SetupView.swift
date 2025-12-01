//
//  SetupView.swift
//  Soltura
//
//  Initial setup screen for configuring conversation preferences
//

import SwiftUI

struct SetupView: View {
    @EnvironmentObject var conversationManager: ConversationManager
    @EnvironmentObject var speechManager: SpeechManager
    @Binding var showSetup: Bool

    @State private var preferences = UserPreferences()
    @State private var selectedScenario: Scenario?
    @State private var showingAnkiImport = false
    @State private var showingTSVImport = false
    @State private var showingDocumentPicker = false
    @State private var selectedMasteryLevel: MasteryLevel = .familiar
    @State private var isInitializing = false

    @StateObject private var ankiManager = AnkiManager()

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Header
                headerSection

                // Proficiency Level
                proficiencySection

                // Anki Integration
                ankiSection

                // Target Vocabulary
                vocabularySection

                // Grammar Focus
                grammarSection

                // Scenarios
                scenarioSection

                // Custom Goal
                customGoalSection

                // Start Button
                startButton

                Spacer(minLength: 40)
            }
            .padding()
        }
        .background(Color(UIColor.systemGroupedBackground))
        .onAppear {
            ankiManager.loadFromUserDefaults()
            speechManager.requestAuthorization()
        }
        .sheet(isPresented: $showingTSVImport) {
            tsvImportSheet
        }
    }

    // MARK: - Header Section

    private var headerSection: some View {
        VStack(spacing: 12) {
            Image(systemName: "globe.americas.fill")
                .font(.system(size: 60))
                .foregroundColor(Color(red: 0.176, green: 0.416, blue: 0.416))

            Text("Soltura")
                .font(.system(size: 36, weight: .bold))
                .foregroundColor(Color(red: 0.176, green: 0.416, blue: 0.416))

            Text("(sohl-too-rah) (f) - fluency, ease")
                .font(.subheadline)
                .foregroundColor(.secondary)

            Text("Practice Spanish naturally. Just say what you want.")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(.vertical)
    }

    // MARK: - Proficiency Section

    private var proficiencySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Proficiency Level")
                .font(.headline)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                ForEach(ProficiencyLevel.allCases, id: \.self) { level in
                    Button(action: {
                        preferences.proficiencyLevel = level
                    }) {
                        Text(level.displayName)
                            .font(.subheadline)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(preferences.proficiencyLevel == level ? Color(red: 0.176, green: 0.416, blue: 0.416) : Color(UIColor.secondarySystemGroupedBackground))
                            .foregroundColor(preferences.proficiencyLevel == level ? .white : .primary)
                            .cornerRadius(8)
                    }
                }
            }

            Text("Auto adapts to your level. Select a specific level for consistent difficulty.")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(UIColor.systemBackground))
        .cornerRadius(12)
    }

    // MARK: - Anki Section

    private var ankiSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Anki Spaced Repetition Integration")
                .font(.headline)

            Text("Import your Anki decks to personalize conversations based on your vocabulary mastery.")
                .font(.caption)
                .foregroundColor(.secondary)

            HStack(spacing: 12) {
                Button(action: {
                    showingTSVImport = true
                }) {
                    HStack {
                        Image(systemName: "doc.text")
                        Text("Import TSV")
                    }
                    .font(.subheadline)
                    .padding(.vertical, 8)
                    .padding(.horizontal, 16)
                    .background(Color(red: 0.176, green: 0.416, blue: 0.416))
                    .foregroundColor(.white)
                    .cornerRadius(8)
                }

                Button(action: {
                    // APKG import not yet implemented
                    showingAnkiImport = true
                }) {
                    HStack {
                        Image(systemName: "square.and.arrow.down")
                        Text("Import APKG")
                    }
                    .font(.subheadline)
                    .padding(.vertical, 8)
                    .padding(.horizontal, 16)
                    .background(Color.secondary.opacity(0.3))
                    .foregroundColor(.primary)
                    .cornerRadius(8)
                }
                .disabled(true)
            }

            if !ankiManager.vocabulary.isEmpty {
                let stats = ankiManager.getStatistics()
                ankiStatsView(stats: stats)
            }
        }
        .padding()
        .background(Color(UIColor.systemBackground))
        .cornerRadius(12)
    }

    private func ankiStatsView(stats: (mastered: Int, familiar: Int, learning: Int, new: Int, total: Int)) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Total Vocabulary: \(stats.total)")
                .font(.subheadline)

            HStack(spacing: 16) {
                StatBadge(count: stats.mastered, label: "Mastered", color: .green)
                StatBadge(count: stats.familiar, label: "Familiar", color: .blue)
                StatBadge(count: stats.learning, label: "Learning", color: .orange)
                StatBadge(count: stats.new, label: "New", color: .red)
            }

            Button("Clear Anki Data") {
                ankiManager.clearVocabulary()
                ankiManager.saveToUserDefaults()
            }
            .font(.caption)
            .foregroundColor(.red)
        }
        .padding(.top, 8)
    }

    // MARK: - Vocabulary Section

    private var vocabularySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Target Vocabulary (Optional)")
                .font(.headline)

            TextEditor(text: Binding(
                get: { preferences.targetVocabulary.joined(separator: ", ") },
                set: { preferences.targetVocabulary = $0.components(separatedBy: ",").map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty } }
            ))
            .frame(height: 80)
            .padding(8)
            .background(Color(UIColor.secondarySystemGroupedBackground))
            .cornerRadius(8)

            Text("Enter words or phrases you want to practice, separated by commas.")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(UIColor.systemBackground))
        .cornerRadius(12)
    }

    // MARK: - Grammar Section

    private var grammarSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Grammar Focus (Optional)")
                .font(.headline)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                ForEach(GrammarFocus.allCases, id: \.self) { grammar in
                    Button(action: {
                        if preferences.grammarFocus.contains(grammar) {
                            preferences.grammarFocus.remove(grammar)
                        } else {
                            preferences.grammarFocus.insert(grammar)
                        }
                    }) {
                        Text(grammar.displayName)
                            .font(.subheadline)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(preferences.grammarFocus.contains(grammar) ? Color(red: 0.176, green: 0.416, blue: 0.416) : Color(UIColor.secondarySystemGroupedBackground))
                            .foregroundColor(preferences.grammarFocus.contains(grammar) ? .white : .primary)
                            .cornerRadius(8)
                    }
                }
            }
        }
        .padding()
        .background(Color(UIColor.systemBackground))
        .cornerRadius(12)
    }

    // MARK: - Scenario Section

    private var scenarioSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Scenarios")
                .font(.headline)

            Menu {
                Button("Custom (use text box below)") {
                    selectedScenario = nil
                    preferences.selectedScenario = ""
                }

                ForEach(ScenarioData.categories, id: \.self) { category in
                    Menu(category) {
                        ForEach(ScenarioData.getScenariosByCategory(category)) { scenario in
                            Button(scenario.title) {
                                selectedScenario = scenario
                                preferences.selectedScenario = scenario.id
                            }
                        }
                    }
                }
            } label: {
                HStack {
                    Text(selectedScenario?.title ?? "Custom (use text box below)")
                        .foregroundColor(.primary)
                    Spacer()
                    Image(systemName: "chevron.down")
                        .foregroundColor(.secondary)
                }
                .padding()
                .background(Color(UIColor.secondarySystemGroupedBackground))
                .cornerRadius(8)
            }
        }
        .padding()
        .background(Color(UIColor.systemBackground))
        .cornerRadius(12)
    }

    // MARK: - Custom Goal Section

    private var customGoalSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Or describe your custom goal")
                .font(.headline)

            TextEditor(text: $preferences.customGoal)
                .frame(height: 100)
                .padding(8)
                .background(Color(UIColor.secondarySystemGroupedBackground))
                .cornerRadius(8)

            Text("Leave blank for general conversation.")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(UIColor.systemBackground))
        .cornerRadius(12)
    }

    // MARK: - Start Button

    private var startButton: some View {
        Button(action: startConversation) {
            HStack {
                if isInitializing {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                } else {
                    Text("Start Conversation")
                        .font(.headline)
                }
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color(red: 0.176, green: 0.416, blue: 0.416))
            .foregroundColor(.white)
            .cornerRadius(12)
        }
        .disabled(isInitializing)
        .padding(.horizontal)
    }

    // MARK: - TSV Import Sheet

    private var tsvImportSheet: some View {
        NavigationView {
            VStack(spacing: 20) {
                Text("Select Mastery Level")
                    .font(.headline)

                VStack(spacing: 12) {
                    ForEach([MasteryLevel.mastered, .familiar, .learning, .new], id: \.self) { level in
                        Button(action: {
                            selectedMasteryLevel = level
                        }) {
                            HStack {
                                VStack(alignment: .leading) {
                                    Text(level.rawValue.capitalized)
                                        .font(.headline)
                                    Text(masteryLevelDescription(level))
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                                Spacer()
                                if selectedMasteryLevel == level {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundColor(.blue)
                                }
                            }
                            .padding()
                            .background(Color(UIColor.secondarySystemGroupedBackground))
                            .cornerRadius(8)
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                }
                .padding()

                Button("Import File") {
                    showingDocumentPicker = true
                    showingTSVImport = false
                }
                .font(.headline)
                .padding()
                .frame(maxWidth: .infinity)
                .background(Color(red: 0.176, green: 0.416, blue: 0.416))
                .foregroundColor(.white)
                .cornerRadius(12)
                .padding(.horizontal)

                Spacer()
            }
            .navigationTitle("Import TSV")
            .navigationBarItems(trailing: Button("Cancel") {
                showingTSVImport = false
            })
        }
        .fileImporter(
            isPresented: $showingDocumentPicker,
            allowedContentTypes: [.plainText, .commaSeparatedText],
            allowsMultipleSelection: false
        ) { result in
            handleTSVImport(result: result)
        }
    }

    // MARK: - Actions

    private func startConversation() {
        isInitializing = true

        // Save Anki vocabulary to preferences
        preferences.ankiVocabulary = ankiManager.vocabulary

        Task {
            do {
                if !conversationManager.isInitialized {
                    try await conversationManager.initialize()
                }

                await MainActor.run {
                    conversationManager.startConversation(preferences: preferences)
                    isInitializing = false
                    showSetup = false
                }
            } catch {
                await MainActor.run {
                    isInitializing = false
                    print("Failed to initialize: \(error)")
                }
            }
        }
    }

    private func handleTSVImport(result: Result<[URL], Error>) {
        switch result {
        case .success(let urls):
            guard let url = urls.first else { return }
            do {
                try ankiManager.importFromTSV(url: url, masteryLevel: selectedMasteryLevel)
                ankiManager.saveToUserDefaults()
            } catch {
                print("Import failed: \(error)")
            }
        case .failure(let error):
            print("File selection failed: \(error)")
        }
    }

    private func masteryLevelDescription(_ level: MasteryLevel) -> String {
        switch level {
        case .mastered:
            return "Words you know very well (6+ months interval)"
        case .familiar:
            return "Words you're comfortable with (3-6 weeks interval)"
        case .learning:
            return "Words you're currently learning (1-3 weeks interval)"
        case .new:
            return "New or challenging words (< 1 week interval)"
        }
    }
}

// MARK: - Stat Badge

struct StatBadge: View {
    let count: Int
    let label: String
    let color: Color

    var body: some View {
        VStack {
            Text("\(count)")
                .font(.headline)
                .foregroundColor(color)
            Text(label)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
    }
}

#Preview {
    SetupView(showSetup: .constant(true))
        .environmentObject(ConversationManager())
        .environmentObject(SpeechManager())
}
