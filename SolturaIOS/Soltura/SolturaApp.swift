//
//  SolturaApp.swift
//  Soltura - AI-Powered Spanish Conversation Practice
//
//  Copyright © 2025 Soltura. All rights reserved.
//

import SwiftUI

@main
struct SolturaApp: App {
    @StateObject private var conversationManager = ConversationManager()
    @StateObject private var speechManager = SpeechManager()

    init() {
        // Configure appearance
        setupAppearance()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(conversationManager)
                .environmentObject(speechManager)
                .preferredColorScheme(.light)
        }
    }

    private func setupAppearance() {
        // Set teal accent color theme
        let tealColor = UIColor(red: 0.176, green: 0.416, blue: 0.416, alpha: 1.0)
        UINavigationBar.appearance().tintColor = tealColor
        UITabBar.appearance().tintColor = tealColor
    }
}
