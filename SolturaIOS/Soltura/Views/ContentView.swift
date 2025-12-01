//
//  ContentView.swift
//  Soltura
//
//  Main content view controller
//

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var conversationManager: ConversationManager
    @State private var showSetup = true

    var body: some View {
        ZStack {
            if showSetup {
                SetupView(showSetup: $showSetup)
                    .transition(.move(edge: .leading))
            } else {
                ConversationView(showSetup: $showSetup)
                    .transition(.move(edge: .trailing))
            }
        }
        .animation(.easeInOut(duration: 0.3), value: showSetup)
    }
}

#Preview {
    ContentView()
        .environmentObject(ConversationManager())
        .environmentObject(SpeechManager())
}
