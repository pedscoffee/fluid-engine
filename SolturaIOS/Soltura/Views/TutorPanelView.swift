//
//  TutorPanelView.swift
//  Soltura
//
//  Tutor panel for grammar feedback and questions
//

import SwiftUI

struct TutorPanelView: View {
    @EnvironmentObject var conversationManager: ConversationManager

    @State private var tutorInput = ""
    @State private var showingTutorSettings = false

    var body: some View {
        VStack(spacing: 0) {
            // Header
            header

            // Tutor Settings (Collapsible)
            if showingTutorSettings {
                tutorSettings
            }

            // Tutor Messages
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 12) {
                    if conversationManager.tutorMessages.isEmpty {
                        Text("Tutor feedback will appear here...")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .padding()
                    } else {
                        ForEach(conversationManager.tutorMessages) { message in
                            tutorMessageView(message: message)
                        }
                    }
                }
                .padding()
            }

            // Input Area
            tutorInputArea
        }
        .background(Color(UIColor.systemGroupedBackground))
    }

    // MARK: - Header

    private var header: some View {
        HStack {
            Text("AI Tutor")
                .font(.headline)

            Spacer()

            Button(action: { showingTutorSettings.toggle() }) {
                Image(systemName: "gearshape")
                    .font(.title3)
                    .foregroundColor(Color(red: 0.176, green: 0.416, blue: 0.416))
            }
        }
        .padding()
        .background(Color(UIColor.systemBackground))
        .shadow(color: Color.black.opacity(0.1), radius: 2, x: 0, y: 2)
    }

    // MARK: - Tutor Settings

    private var tutorSettings: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Tutor Focus")
                .font(.subheadline)
                .bold()

            Picker("Preset", selection: $conversationManager.preferences.tutorPreset) {
                ForEach(TutorPreset.allCases, id: \.self) { preset in
                    Text(preset.displayName).tag(preset)
                }
            }
            .pickerStyle(MenuPickerStyle())

            if conversationManager.preferences.tutorPreset == .custom {
                TextField("Custom instruction...", text: $conversationManager.preferences.tutorCustomInstruction)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
            }

            Divider()

            Text("Feedback Language")
                .font(.subheadline)
                .bold()

            Picker("Language", selection: $conversationManager.preferences.tutorLanguage) {
                Text("English").tag("english")
                Text("Spanish").tag("spanish")
            }
            .pickerStyle(SegmentedPickerStyle())

            Button("Apply") {
                showingTutorSettings = false
            }
            .font(.subheadline)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
            .background(Color(red: 0.176, green: 0.416, blue: 0.416))
            .foregroundColor(.white)
            .cornerRadius(8)
        }
        .padding()
        .background(Color(UIColor.systemBackground))
        .transition(.move(edge: .top))
    }

    // MARK: - Tutor Message View

    private func tutorMessageView(message: TutorMessage) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(message.content)
                .font(.subheadline)
                .padding(10)
                .background(Color(UIColor.systemBackground))
                .cornerRadius(8)

            Text(message.timestamp, style: .time)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
    }

    // MARK: - Input Area

    private var tutorInputArea: some View {
        HStack(spacing: 8) {
            TextField("Ask the tutor a question...", text: $tutorInput)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .onSubmit(sendTutorQuestion)

            Button(action: sendTutorQuestion) {
                Image(systemName: "paperplane.fill")
                    .foregroundColor(.white)
                    .padding(10)
                    .background(Color(red: 0.176, green: 0.416, blue: 0.416))
                    .clipShape(Circle())
            }
            .disabled(tutorInput.isEmpty)
        }
        .padding()
        .background(Color(UIColor.systemBackground))
        .shadow(color: Color.black.opacity(0.1), radius: 2, x: 0, y: -2)
    }

    // MARK: - Actions

    private func sendTutorQuestion() {
        let question = tutorInput.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !question.isEmpty else { return }

        tutorInput = ""

        Task {
            await conversationManager.sendTutorQuestion(question)
        }
    }
}

#Preview {
    TutorPanelView()
        .environmentObject(ConversationManager())
        .frame(width: 300)
}
