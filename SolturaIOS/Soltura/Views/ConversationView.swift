//
//  ConversationView.swift
//  Soltura
//
//  Main conversation interface with chat and tutor panel
//

import SwiftUI

struct ConversationView: View {
    @EnvironmentObject var conversationManager: ConversationManager
    @EnvironmentObject var speechManager: SpeechManager
    @Binding var showSetup: Bool

    @State private var inputText = ""
    @State private var showTutorPanel = false
    @State private var showSettings = false
    @State private var showSystemPrompt = false
    @State private var isRecording = false

    var body: some View {
        VStack(spacing: 0) {
            // Top Bar
            topBar

            HStack(spacing: 0) {
                // Chat Area
                chatArea
                    .frame(maxWidth: .infinity)

                // Tutor Panel (Sliding from right)
                if showTutorPanel {
                    TutorPanelView()
                        .frame(width: 300)
                        .transition(.move(edge: .trailing))
                }
            }
        }
        .sheet(isPresented: $showSettings) {
            settingsSheet
        }
        .sheet(isPresented: $showSystemPrompt) {
            systemPromptSheet
        }
    }

    // MARK: - Top Bar

    private var topBar: some View {
        HStack {
            Button(action: { showSetup = true }) {
                Image(systemName: "arrow.left")
                    .font(.title3)
                    .foregroundColor(Color(red: 0.176, green: 0.416, blue: 0.416))
            }

            Spacer()

            HStack(spacing: 8) {
                Image(systemName: "globe.americas.fill")
                    .foregroundColor(Color(red: 0.176, green: 0.416, blue: 0.416))
                Circle()
                    .fill(conversationManager.connectionStatus == "Connected" ? Color.green : Color.orange)
                    .frame(width: 8, height: 8)
                Text(conversationManager.connectionStatus)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }

            Spacer()

            HStack(spacing: 16) {
                Button(action: { showSystemPrompt = true }) {
                    Image(systemName: "info.circle")
                        .font(.title3)
                }

                Button(action: { showTutorPanel.toggle() }) {
                    Image(systemName: "doc.text")
                        .font(.title3)
                }

                Button(action: {
                    conversationManager.clearConversation()
                }) {
                    Image(systemName: "trash")
                        .font(.title3)
                }

                Button(action: { showSettings = true }) {
                    Image(systemName: "gearshape")
                        .font(.title3)
                }
            }
            .foregroundColor(Color(red: 0.176, green: 0.416, blue: 0.416))
        }
        .padding()
        .background(Color(UIColor.systemBackground))
        .shadow(color: Color.black.opacity(0.1), radius: 2, x: 0, y: 2)
    }

    // MARK: - Chat Area

    private var chatArea: some View {
        VStack(spacing: 0) {
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 16) {
                        ForEach(conversationManager.messages) { message in
                            MessageBubble(message: message)
                                .id(message.id)
                        }

                        if conversationManager.isLoading {
                            HStack {
                                ProgressView()
                                    .padding(.leading)
                                Spacer()
                            }
                        }
                    }
                    .padding()
                }
                .onChange(of: conversationManager.messages.count) { _ in
                    if let lastMessage = conversationManager.messages.last {
                        withAnimation {
                            proxy.scrollTo(lastMessage.id, anchor: .bottom)
                        }
                    }
                }
            }

            // Input Area
            inputArea
        }
    }

    // MARK: - Input Area

    private var inputArea: some View {
        VStack(spacing: 12) {
            HStack(spacing: 12) {
                TextField("Type a message...", text: $inputText)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .onSubmit(sendMessage)

                Button(action: sendMessage) {
                    Image(systemName: "paperplane.fill")
                        .foregroundColor(.white)
                        .padding(12)
                        .background(Color(red: 0.176, green: 0.416, blue: 0.416))
                        .clipShape(Circle())
                }
                .disabled(inputText.isEmpty)

                Button(action: toggleRecording) {
                    Image(systemName: isRecording ? "stop.circle.fill" : "mic.fill")
                        .foregroundColor(.white)
                        .padding(14)
                        .background(isRecording ? Color.red : Color(red: 0.176, green: 0.416, blue: 0.416))
                        .clipShape(Circle())
                }
            }
            .padding(.horizontal)
            .padding(.bottom, 8)

            if isRecording {
                Text("Listening...")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(.bottom, 8)
            }
        }
        .padding(.vertical, 8)
        .background(Color(UIColor.systemBackground))
        .shadow(color: Color.black.opacity(0.1), radius: 2, x: 0, y: -2)
    }

    // MARK: - Settings Sheet

    private var settingsSheet: some View {
        NavigationView {
            Form {
                Section(header: Text("Audio")) {
                    Toggle("Mute Voice", isOn: Binding(
                        get: { conversationManager.preferences.voiceMuted },
                        set: { newValue in
                            conversationManager.preferences.voiceMuted = newValue
                            speechManager.setMuted(newValue)
                        }
                    ))
                }

                Section(header: Text("Voice")) {
                    Picker("Spanish Voice", selection: $conversationManager.preferences.selectedVoice) {
                        Text("Default").tag("")
                        ForEach(speechManager.getAvailableSpanishVoices(), id: \.identifier) { voice in
                            Text("\(voice.name) (\(voice.language))")
                                .tag(voice.identifier)
                        }
                    }
                }
            }
            .navigationTitle("Settings")
            .navigationBarItems(trailing: Button("Done") {
                showSettings = false
            })
        }
    }

    // MARK: - System Prompt Sheet

    private var systemPromptSheet: some View {
        NavigationView {
            ScrollView {
                Text(conversationManager.getSystemPrompt())
                    .font(.system(.caption, design: .monospaced))
                    .padding()
            }
            .navigationTitle("System Prompt (Debug)")
            .navigationBarItems(
                leading: Button("Copy") {
                    UIPasteboard.general.string = conversationManager.getSystemPrompt()
                },
                trailing: Button("Close") {
                    showSystemPrompt = false
                }
            )
        }
    }

    // MARK: - Actions

    private func sendMessage() {
        let message = inputText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !message.isEmpty else { return }

        inputText = ""

        Task {
            await conversationManager.sendMessage(message)

            // Speak the response if not muted
            if !conversationManager.preferences.voiceMuted,
               let lastMessage = conversationManager.messages.last,
               lastMessage.role == "assistant" {
                speechManager.speak(lastMessage.content)
            }
        }
    }

    private func toggleRecording() {
        if isRecording {
            speechManager.stopRecording()
            isRecording = false
        } else {
            isRecording = true
            do {
                try speechManager.startRecording { transcription in
                    inputText = transcription
                    isRecording = false
                }
            } catch {
                print("Failed to start recording: \(error)")
                isRecording = false
            }
        }
    }
}

// MARK: - Message Bubble

struct MessageBubble: View {
    let message: Message

    var body: some View {
        HStack {
            if message.role == "user" {
                Spacer()
            }

            VStack(alignment: message.role == "user" ? .trailing : .leading, spacing: 4) {
                Text(message.content)
                    .padding(12)
                    .background(message.role == "user"
                                ? Color(red: 0.176, green: 0.416, blue: 0.416)
                                : Color(UIColor.secondarySystemGroupedBackground))
                    .foregroundColor(message.role == "user" ? .white : .primary)
                    .cornerRadius(16)

                Text(message.timestamp, style: .time)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }

            if message.role == "assistant" {
                Spacer()
            }
        }
    }
}

#Preview {
    ConversationView(showSetup: .constant(false))
        .environmentObject(ConversationManager())
        .environmentObject(SpeechManager())
}
