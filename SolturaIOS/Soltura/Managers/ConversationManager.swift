//
//  ConversationManager.swift
//  Soltura
//
//  Manages conversation state and coordinates LLM interactions
//

import Foundation
import SwiftUI

struct Message: Identifiable, Codable {
    let id = UUID()
    let role: String // "user" or "assistant"
    let content: String
    let timestamp: Date

    init(role: String, content: String) {
        self.role = role
        self.content = content
        self.timestamp = Date()
    }
}

struct TutorMessage: Identifiable {
    let id = UUID()
    let content: String
    let timestamp: Date

    init(content: String) {
        self.content = content
        self.timestamp = Date()
    }
}

class ConversationManager: ObservableObject {
    @Published var messages: [Message] = []
    @Published var tutorMessages: [TutorMessage] = []
    @Published var isLoading = false
    @Published var connectionStatus = "Ready"
    @Published var preferences = UserPreferences()

    private let llmManager = LLMManager()
    private var systemPrompt: String = ""

    var isInitialized: Bool {
        llmManager.isInitialized
    }

    // MARK: - Initialization

    func initialize() async throws {
        try await llmManager.initialize { progress, message in
            DispatchQueue.main.async {
                self.connectionStatus = message
            }
        }
        DispatchQueue.main.async {
            self.connectionStatus = "Ready"
        }
    }

    // MARK: - Conversation Management

    func startConversation(preferences: UserPreferences) {
        self.preferences = preferences

        // Build system prompt
        let builder = PromptBuilder(preferences: preferences)
        systemPrompt = builder.build()

        llmManager.startConversation(systemPrompt: systemPrompt)

        // Add initial greeting
        messages = [
            Message(role: "assistant", content: "¡Hola! Estoy listo para practicar contigo. ¿De qué quieres hablar hoy?")
        ]

        connectionStatus = "Connected"
    }

    func sendMessage(_ text: String) async {
        guard !text.isEmpty else { return }

        // Add user message
        await MainActor.run {
            messages.append(Message(role: "user", content: text))
            isLoading = true
            connectionStatus = "Thinking..."
        }

        do {
            // Generate response
            let response = try await llmManager.generateResponse(userMessage: text)

            // Add assistant message
            await MainActor.run {
                messages.append(Message(role: "assistant", content: response))
                isLoading = false
                connectionStatus = "Connected"
            }

            // Optionally generate tutor feedback
            if preferences.tutorPreset != .translation {
                await generateTutorFeedback(userMessage: text, assistantResponse: response)
            }
        } catch {
            await MainActor.run {
                messages.append(Message(role: "assistant", content: "Lo siento, tuve un problema. ¿Puedes intentar de nuevo?"))
                isLoading = false
                connectionStatus = "Error"
            }
        }
    }

    func clearConversation() {
        messages = [
            Message(role: "assistant", content: "¡Hola! Estoy listo para practicar contigo. ¿De qué quieres hablar hoy?")
        ]
        llmManager.clearConversation()
    }

    func getSystemPrompt() -> String {
        return systemPrompt
    }

    // MARK: - Tutor Panel

    func sendTutorQuestion(_ question: String) async {
        guard !question.isEmpty else { return }

        await MainActor.run {
            tutorMessages.append(TutorMessage(content: "Q: \(question)"))
        }

        // Build tutor prompt
        let tutorPrompt = buildTutorPrompt(question: question)

        do {
            let response = try await llmManager.generateResponse(userMessage: tutorPrompt)

            await MainActor.run {
                tutorMessages.append(TutorMessage(content: response))
            }
        } catch {
            await MainActor.run {
                tutorMessages.append(TutorMessage(content: "Error: Unable to get tutor response"))
            }
        }
    }

    private func generateTutorFeedback(userMessage: String, assistantResponse: String) async {
        // Generate automatic feedback based on tutor preset
        let feedbackPrompt = buildFeedbackPrompt(userMessage: userMessage, preset: preferences.tutorPreset)

        do {
            let feedback = try await llmManager.generateResponse(userMessage: feedbackPrompt)

            await MainActor.run {
                if !feedback.isEmpty {
                    tutorMessages.append(TutorMessage(content: feedback))
                }
            }
        } catch {
            print("Failed to generate tutor feedback: \(error)")
        }
    }

    private func buildTutorPrompt(question: String) -> String {
        let language = preferences.tutorLanguage == "spanish" ? "Spanish" : "English"
        return "As a Spanish tutor, please answer this question in \(language): \(question)"
    }

    private func buildFeedbackPrompt(userMessage: String, preset: TutorPreset) -> String {
        let language = preferences.tutorLanguage == "spanish" ? "Spanish" : "English"

        switch preset {
        case .translation:
            return "Translate this Spanish to \(language): \(userMessage)"
        case .grammar:
            return "In \(language), briefly explain the grammar used in: \(userMessage)"
        case .verbs:
            return "In \(language), identify and explain any irregular verbs in: \(userMessage)"
        case .vocabulary:
            return "In \(language), explain 1-2 key vocabulary words from: \(userMessage)"
        case .mistakes:
            return "In \(language), if there are errors in '\(userMessage)', point them out gently and explain the correction"
        case .custom:
            if !preferences.tutorCustomInstruction.isEmpty {
                return "Regarding '\(userMessage)', \(preferences.tutorCustomInstruction). Respond in \(language)."
            }
            return "Translate this Spanish to \(language): \(userMessage)"
        }
    }

    func clearTutorMessages() {
        tutorMessages = []
    }

    // MARK: - Translation

    func translate(_ text: String) async -> String {
        do {
            return try await llmManager.translate(text: text, from: "es", to: "en")
        } catch {
            return "[Translation unavailable]"
        }
    }
}
