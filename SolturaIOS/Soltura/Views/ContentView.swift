//
//  ContentView.swift
//  Soltura
//
//  Main content view controller
//

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var conversationManager: ConversationManager
    @StateObject private var modelManager = ModelManager.shared

    @State private var hasModel = false
    @State private var showSetup = true

    var body: some View {
        ZStack {
            if !hasModel && !modelManager.isModelAvailable {
                // First time: Download model
                ModelDownloadView(hasModel: $hasModel)
                    .transition(.opacity)
            } else if showSetup {
                // Second: Setup preferences
                SetupView(showSetup: $showSetup)
                    .transition(.move(edge: .leading))
            } else {
                // Third: Conversation
                ConversationView(showSetup: $showSetup)
                    .transition(.move(edge: .trailing))
            }
        }
        .animation(.easeInOut(duration: 0.3), value: hasModel)
        .animation(.easeInOut(duration: 0.3), value: showSetup)
        .onAppear {
            // Check if model is already downloaded
            hasModel = modelManager.isModelAvailable
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(ConversationManager())
        .environmentObject(SpeechManager())
}
