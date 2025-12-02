//
//  ModelManager.swift
//  Soltura
//
//  Manages on-demand model downloading and storage
//

import Foundation
import Combine

enum ModelSize: String, CaseIterable, Identifiable {
    case small = "1B"
    case medium = "3B"

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .small: return "Llama 3.2 1B (Compact)"
        case .medium: return "Llama 3.2 3B (Better Quality)"
        }
    }

    var sizeInMB: Int {
        switch self {
        case .small: return 700
        case .medium: return 2000
        }
    }

    var downloadURL: URL {
        switch self {
        case .small:
            return URL(string: "https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf")!
        case .medium:
            return URL(string: "https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf")!
        }
    }

    var recommendedDevices: String {
        switch self {
        case .small:
            return "iPhone 13-14, iPad Pro (2021-2022)"
        case .medium:
            return "iPhone 15 Pro or newer, iPad Pro (M1/M2)"
        }
    }

    var description: String {
        switch self {
        case .small:
            return "Faster responses, uses less battery. Good quality for everyday practice."
        case .medium:
            return "Best quality conversations with more natural Spanish. Requires more powerful device."
        }
    }

    var fileName: String {
        switch self {
        case .small: return "llama-1b-q4.gguf"
        case .medium: return "llama-3b-q4.gguf"
        }
    }
}

class ModelManager: NSObject, ObservableObject {
    @Published var downloadState: DownloadState = .notStarted
    @Published var downloadProgress: Double = 0.0
    @Published var downloadedBytes: Int64 = 0
    @Published var totalBytes: Int64 = 0
    @Published var downloadSpeed: Double = 0.0 // bytes per second
    @Published var estimatedTimeRemaining: TimeInterval = 0
    @Published var currentModel: ModelSize?
    @Published var isModelAvailable = false

    private var downloadTask: URLSessionDownloadTask?
    private var urlSession: URLSession!
    private var lastBytesReceived: Int64 = 0
    private var lastUpdateTime: Date = Date()

    enum DownloadState {
        case notStarted
        case downloading
        case paused
        case completed
        case failed(Error)
        case cancelled
    }

    static let shared = ModelManager()

    override init() {
        super.init()
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 300 // 5 minutes
        config.timeoutIntervalForResource = 3600 // 1 hour
        urlSession = URLSession(configuration: config, delegate: self, delegateQueue: nil)

        // Check if model already exists
        checkForExistingModel()
    }

    // MARK: - Model Storage

    private func getModelDirectory() -> URL {
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let modelsDir = documentsPath.appendingPathComponent("Models", isDirectory: true)

        // Create directory if it doesn't exist
        if !FileManager.default.fileExists(atPath: modelsDir.path) {
            try? FileManager.default.createDirectory(at: modelsDir, withIntermediateDirectories: true)
        }

        return modelsDir
    }

    func getModelPath(for size: ModelSize) -> URL {
        return getModelDirectory().appendingPathComponent(size.fileName)
    }

    func isModelDownloaded(size: ModelSize) -> Bool {
        let path = getModelPath(for: size)
        return FileManager.default.fileExists(atPath: path.path)
    }

    private func checkForExistingModel() {
        // Check which model is already downloaded
        for size in ModelSize.allCases {
            if isModelDownloaded(size: size) {
                DispatchQueue.main.async {
                    self.currentModel = size
                    self.isModelAvailable = true
                    self.downloadState = .completed
                }
                break
            }
        }
    }

    // MARK: - Download Management

    func startDownload(modelSize: ModelSize, allowCellular: Bool = false) {
        guard downloadState != .downloading else { return }

        let url = modelSize.downloadURL
        let destinationPath = getModelPath(for: modelSize)

        // Check if already downloaded
        if isModelDownloaded(size: modelSize) {
            DispatchQueue.main.async {
                self.currentModel = modelSize
                self.isModelAvailable = true
                self.downloadState = .completed
            }
            return
        }

        // Check available storage
        if !hasEnoughStorage(for: modelSize) {
            DispatchQueue.main.async {
                self.downloadState = .failed(ModelError.insufficientStorage(required: modelSize.sizeInMB))
            }
            return
        }

        // Check network conditions
        if !allowCellular && !isOnWiFi() {
            DispatchQueue.main.async {
                self.downloadState = .failed(ModelError.wifiRequired)
            }
            return
        }

        DispatchQueue.main.async {
            self.downloadState = .downloading
            self.downloadProgress = 0.0
            self.downloadedBytes = 0
            self.totalBytes = 0
            self.currentModel = modelSize
            self.lastUpdateTime = Date()
        }

        var request = URLRequest(url: url)
        request.timeoutInterval = 300

        downloadTask = urlSession.downloadTask(with: request)
        downloadTask?.resume()
    }

    func pauseDownload() {
        downloadTask?.cancel()
        DispatchQueue.main.async {
            self.downloadState = .paused
        }
    }

    func cancelDownload() {
        downloadTask?.cancel()
        DispatchQueue.main.async {
            self.downloadState = .cancelled
            self.downloadProgress = 0.0
            self.downloadedBytes = 0
            self.totalBytes = 0
        }
    }

    func deleteModel(size: ModelSize) {
        let path = getModelPath(for: size)
        try? FileManager.default.removeItem(at: path)

        if currentModel == size {
            DispatchQueue.main.async {
                self.currentModel = nil
                self.isModelAvailable = false
                self.downloadState = .notStarted
            }
        }
    }

    // MARK: - Storage & Network Checks

    func getAvailableStorageInMB() -> Int {
        if let systemAttributes = try? FileManager.default.attributesOfFileSystem(forPath: NSHomeDirectory()),
           let freeSize = systemAttributes[.systemFreeSize] as? NSNumber {
            return Int(freeSize.int64Value / 1024 / 1024)
        }
        return 0
    }

    func hasEnoughStorage(for modelSize: ModelSize) -> Bool {
        let availableMB = getAvailableStorageInMB()
        // Add 500MB buffer for safety
        return availableMB > (modelSize.sizeInMB + 500)
    }

    func isOnWiFi() -> Bool {
        // Simple check - in production you might use Network framework for more detailed check
        // For now, we'll be permissive and return true
        // Users can opt-in to cellular in the UI
        return true
    }

    func getRecommendedModel() -> ModelSize {
        // Detect device and recommend appropriate model
        let deviceModel = UIDevice.current.model

        // Check for iPhone model year (simplified)
        if #available(iOS 17.0, *) {
            // Newer devices can handle 3B model
            return .medium
        } else {
            return .small
        }
    }
}

// MARK: - URLSessionDownloadDelegate

extension ModelManager: URLSessionDownloadDelegate {
    func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask, didFinishDownloadingTo location: URL) {
        guard let modelSize = currentModel else { return }

        let destinationPath = getModelPath(for: modelSize)

        do {
            // Remove existing file if it exists
            if FileManager.default.fileExists(atPath: destinationPath.path) {
                try FileManager.default.removeItem(at: destinationPath)
            }

            // Move downloaded file to permanent location
            try FileManager.default.moveItem(at: location, to: destinationPath)

            DispatchQueue.main.async {
                self.downloadState = .completed
                self.downloadProgress = 1.0
                self.isModelAvailable = true
            }

            print("Model downloaded successfully to: \(destinationPath)")
        } catch {
            DispatchQueue.main.async {
                self.downloadState = .failed(error)
            }
            print("Failed to move model file: \(error)")
        }
    }

    func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask, didWriteData bytesWritten: Int64, totalBytesWritten: Int64, totalBytesExpectedToWrite: Int64) {

        let progress = Double(totalBytesWritten) / Double(totalBytesExpectedToWrite)

        // Calculate download speed
        let now = Date()
        let timeElapsed = now.timeIntervalSince(lastUpdateTime)

        if timeElapsed > 0.5 { // Update speed every 0.5 seconds
            let bytesDownloadedSinceLastUpdate = totalBytesWritten - lastBytesReceived
            let speed = Double(bytesDownloadedSinceLastUpdate) / timeElapsed

            let bytesRemaining = totalBytesExpectedToWrite - totalBytesWritten
            let timeRemaining = bytesRemaining > 0 ? Double(bytesRemaining) / speed : 0

            DispatchQueue.main.async {
                self.downloadSpeed = speed
                self.estimatedTimeRemaining = timeRemaining
            }

            lastBytesReceived = totalBytesWritten
            lastUpdateTime = now
        }

        DispatchQueue.main.async {
            self.downloadProgress = progress
            self.downloadedBytes = totalBytesWritten
            self.totalBytes = totalBytesExpectedToWrite
        }
    }

    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        if let error = error {
            // Check if it was a cancellation
            let nsError = error as NSError
            if nsError.domain == NSURLErrorDomain && nsError.code == NSURLErrorCancelled {
                // Already handled in cancelDownload() or pauseDownload()
                return
            }

            DispatchQueue.main.async {
                self.downloadState = .failed(error)
            }
            print("Download failed with error: \(error)")
        }
    }
}

// MARK: - Errors

enum ModelError: LocalizedError {
    case insufficientStorage(required: Int)
    case wifiRequired
    case downloadFailed
    case modelNotFound

    var errorDescription: String? {
        switch self {
        case .insufficientStorage(let required):
            return "Not enough storage. Need at least \(required)MB free."
        case .wifiRequired:
            return "WiFi connection required for large download. Connect to WiFi or enable cellular in settings."
        case .downloadFailed:
            return "Download failed. Please check your internet connection and try again."
        case .modelNotFound:
            return "Model file not found. Please download a model first."
        }
    }
}

// MARK: - Formatting Helpers

extension ModelManager {
    func formatBytes(_ bytes: Int64) -> String {
        let formatter = ByteCountFormatter()
        formatter.allowedUnits = [.useMB, .useGB]
        formatter.countStyle = .file
        return formatter.string(fromByteCount: bytes)
    }

    func formatSpeed(_ bytesPerSecond: Double) -> String {
        let mbPerSecond = bytesPerSecond / 1024 / 1024
        return String(format: "%.1f MB/s", mbPerSecond)
    }

    func formatTimeRemaining(_ seconds: TimeInterval) -> String {
        if seconds < 60 {
            return String(format: "%.0f sec", seconds)
        } else if seconds < 3600 {
            let minutes = Int(seconds / 60)
            return "\(minutes) min"
        } else {
            let hours = Int(seconds / 3600)
            let minutes = Int((seconds.truncatingRemainder(dividingBy: 3600)) / 60)
            return "\(hours)h \(minutes)m"
        }
    }
}
