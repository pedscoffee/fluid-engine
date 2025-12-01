//
//  SpeechManager.swift
//  Soltura
//
//  Manages speech recognition and text-to-speech for Spanish practice
//

import Foundation
import Speech
import AVFoundation

class SpeechManager: NSObject, ObservableObject {
    @Published var isRecording = false
    @Published var recognizedText = ""
    @Published var authorizationStatus: SFSpeechRecognizerAuthorizationStatus = .notDetermined
    @Published var isSpeaking = false

    private var speechRecognizer: SFSpeechRecognizer?
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private let audioEngine = AVAudioEngine()

    private let speechSynthesizer = AVSpeechSynthesizer()
    private var isMuted = false

    override init() {
        super.init()
        speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "es-ES"))
        speechSynthesizer.delegate = self
    }

    // MARK: - Authorization

    func requestAuthorization() {
        SFSpeechRecognizer.requestAuthorization { [weak self] status in
            DispatchQueue.main.async {
                self?.authorizationStatus = status
            }
        }
    }

    // MARK: - Speech Recognition

    func startRecording(completion: @escaping (String) -> Void) throws {
        // Cancel previous task if any
        if recognitionTask != nil {
            recognitionTask?.cancel()
            recognitionTask = nil
        }

        // Configure audio session
        let audioSession = AVAudioSession.sharedInstance()
        try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
        try audioSession.setActive(true, options: .notifyOthersOnDeactivation)

        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
        guard let recognitionRequest = recognitionRequest else {
            throw NSError(domain: "SpeechManager", code: 1, userInfo: [NSLocalizedDescriptionKey: "Unable to create recognition request"])
        }

        recognitionRequest.shouldReportPartialResults = true

        let inputNode = audioEngine.inputNode
        recognitionTask = speechRecognizer?.recognitionTask(with: recognitionRequest) { [weak self] result, error in
            guard let self = self else { return }

            var isFinal = false

            if let result = result {
                DispatchQueue.main.async {
                    self.recognizedText = result.bestTranscription.formattedString
                }
                isFinal = result.isFinal
            }

            if error != nil || isFinal {
                self.audioEngine.stop()
                inputNode.removeTap(onBus: 0)
                self.recognitionRequest = nil
                self.recognitionTask = nil

                DispatchQueue.main.async {
                    self.isRecording = false
                    if isFinal {
                        completion(self.recognizedText)
                        self.recognizedText = ""
                    }
                }
            }
        }

        let recordingFormat = inputNode.outputFormat(forBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
            recognitionRequest.append(buffer)
        }

        audioEngine.prepare()
        try audioEngine.start()

        DispatchQueue.main.async {
            self.isRecording = true
            self.recognizedText = ""
        }
    }

    func stopRecording() {
        if audioEngine.isRunning {
            audioEngine.stop()
            recognitionRequest?.endAudio()
        }
    }

    // MARK: - Text-to-Speech

    func speak(_ text: String, language: String = "es-ES") {
        guard !isMuted else { return }

        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = AVSpeechSynthesisVoice(language: language)
        utterance.rate = 0.5 // Slightly slower for learning
        utterance.pitchMultiplier = 1.0

        DispatchQueue.main.async {
            self.isSpeaking = true
        }

        speechSynthesizer.speak(utterance)
    }

    func stopSpeaking() {
        speechSynthesizer.stopSpeaking(at: .immediate)
        DispatchQueue.main.async {
            self.isSpeaking = false
        }
    }

    func setMuted(_ muted: Bool) {
        self.isMuted = muted
        if muted {
            stopSpeaking()
        }
    }

    // MARK: - Available Voices

    func getAvailableSpanishVoices() -> [AVSpeechSynthesisVoice] {
        let allVoices = AVSpeechSynthesisVoice.speechVoices()
        return allVoices.filter { $0.language.hasPrefix("es") }
    }
}

// MARK: - AVSpeechSynthesizerDelegate

extension SpeechManager: AVSpeechSynthesizerDelegate {
    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        DispatchQueue.main.async {
            self.isSpeaking = false
        }
    }

    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) {
        DispatchQueue.main.async {
            self.isSpeaking = false
        }
    }
}
