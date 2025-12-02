//
//  ModelDownloadView.swift
//  Soltura
//
//  Model selection and download interface
//

import SwiftUI

struct ModelDownloadView: View {
    @StateObject private var modelManager = ModelManager.shared
    @Binding var hasModel: Bool

    @State private var selectedModel: ModelSize
    @State private var showingStorageWarning = false
    @State private var allowCellularDownload = false
    @State private var showingCellularWarning = false

    init(hasModel: Binding<Bool>) {
        self._hasModel = hasModel
        _selectedModel = State(initialValue: ModelManager.shared.getRecommendedModel())
    }

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Header
                    headerSection

                    // Model already downloaded
                    if modelManager.isModelAvailable {
                        modelReadySection
                    } else {
                        // Model selection
                        modelSelectionSection

                        // Download status
                        if case .downloading = modelManager.downloadState {
                            downloadProgressSection
                        } else if case .failed(let error) = modelManager.downloadState {
                            errorSection(error: error)
                        } else {
                            // Download button
                            downloadButtonSection
                        }

                        // Storage info
                        storageInfoSection
                    }
                }
                .padding()
            }
            .background(Color(UIColor.systemGroupedBackground))
            .navigationTitle("Download AI Model")
            .navigationBarTitleDisplayMode(.inline)
        }
        .alert("Storage Warning", isPresented: $showingStorageWarning) {
            Button("OK", role: .cancel) { }
        } message: {
            Text("You may not have enough storage for this model. Consider choosing a smaller model or freeing up space.")
        }
        .alert("Use Cellular Data?", isPresented: $showingCellularWarning) {
            Button("Cancel", role: .cancel) { }
            Button("Download") {
                allowCellularDownload = true
                startDownload()
            }
        } message: {
            Text("This model is \(selectedModel.sizeInMB)MB. It's recommended to download over WiFi to avoid data charges.")
        }
    }

    // MARK: - Header Section

    private var headerSection: some View {
        VStack(spacing: 16) {
            Image(systemName: "arrow.down.circle.fill")
                .font(.system(size: 60))
                .foregroundColor(Color(red: 0.176, green: 0.416, blue: 0.416))

            Text("One-Time Setup")
                .font(.title.bold())

            Text("Download an AI model to enable Spanish conversation practice. This happens once and works completely offline afterwards.")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
        }
        .padding(.vertical)
    }

    // MARK: - Model Ready Section

    private var modelReadySection: some View {
        VStack(spacing: 16) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 60))
                .foregroundColor(.green)

            Text("Model Ready!")
                .font(.title.bold())

            if let currentModel = modelManager.currentModel {
                Text("Using \(currentModel.displayName)")
                    .font(.body)
                    .foregroundColor(.secondary)

                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text("Model Size:")
                        Spacer()
                        Text(modelManager.formatBytes(Int64(currentModel.sizeInMB * 1024 * 1024)))
                            .foregroundColor(.secondary)
                    }
                    HStack {
                        Text("Location:")
                        Spacer()
                        Text("On Device")
                            .foregroundColor(.secondary)
                    }
                }
                .padding()
                .background(Color(UIColor.secondarySystemGroupedBackground))
                .cornerRadius(12)
            }

            Button(action: {
                hasModel = true
            }) {
                Text("Continue to App")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color(red: 0.176, green: 0.416, blue: 0.416))
                    .foregroundColor(.white)
                    .cornerRadius(12)
            }

            Button("Download Different Model") {
                modelManager.deleteModel(size: modelManager.currentModel!)
            }
            .font(.subheadline)
            .foregroundColor(.secondary)
        }
        .padding()
    }

    // MARK: - Model Selection Section

    private var modelSelectionSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Choose Model Size")
                .font(.headline)

            Text("Recommended for your device: \(modelManager.getRecommendedModel().displayName)")
                .font(.caption)
                .foregroundColor(.secondary)

            ForEach(ModelSize.allCases) { model in
                ModelCard(
                    model: model,
                    isSelected: selectedModel == model,
                    isRecommended: modelManager.getRecommendedModel() == model,
                    availableStorage: modelManager.getAvailableStorageInMB()
                ) {
                    selectedModel = model
                }
            }
        }
    }

    // MARK: - Download Progress Section

    private var downloadProgressSection: some View {
        VStack(spacing: 16) {
            Text("Downloading \(selectedModel.displayName)")
                .font(.headline)

            ProgressView(value: modelManager.downloadProgress) {
                HStack {
                    Text("Progress")
                    Spacer()
                    Text("\(Int(modelManager.downloadProgress * 100))%")
                        .foregroundColor(.secondary)
                }
            }

            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Downloaded")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(modelManager.formatBytes(modelManager.downloadedBytes))
                        .font(.subheadline)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text("Total Size")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(modelManager.formatBytes(modelManager.totalBytes))
                        .font(.subheadline)
                }
            }

            if modelManager.downloadSpeed > 0 {
                HStack {
                    Text("Speed: \(modelManager.formatSpeed(modelManager.downloadSpeed))")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Spacer()

                    Text("Time remaining: \(modelManager.formatTimeRemaining(modelManager.estimatedTimeRemaining))")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            Button("Cancel Download") {
                modelManager.cancelDownload()
            }
            .font(.subheadline)
            .foregroundColor(.red)
        }
        .padding()
        .background(Color(UIColor.systemBackground))
        .cornerRadius(12)
    }

    // MARK: - Error Section

    private func errorSection(error: Error) -> some View {
        VStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 40))
                .foregroundColor(.orange)

            Text("Download Failed")
                .font(.headline)

            Text(error.localizedDescription)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)

            Button("Try Again") {
                startDownload()
            }
            .font(.subheadline)
            .padding(.vertical, 8)
            .padding(.horizontal, 16)
            .background(Color(red: 0.176, green: 0.416, blue: 0.416))
            .foregroundColor(.white)
            .cornerRadius(8)
        }
        .padding()
        .background(Color(UIColor.systemBackground))
        .cornerRadius(12)
    }

    // MARK: - Download Button Section

    private var downloadButtonSection: some View {
        VStack(spacing: 12) {
            Button(action: {
                if !modelManager.hasEnoughStorage(for: selectedModel) {
                    showingStorageWarning = true
                } else if !modelManager.isOnWiFi() && !allowCellularDownload {
                    showingCellularWarning = true
                } else {
                    startDownload()
                }
            }) {
                HStack {
                    Image(systemName: "arrow.down.circle.fill")
                    Text("Download \(selectedModel.displayName)")
                        .font(.headline)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color(red: 0.176, green: 0.416, blue: 0.416))
                .foregroundColor(.white)
                .cornerRadius(12)
            }

            Toggle("Allow Cellular Download", isOn: $allowCellularDownload)
                .font(.subheadline)
                .padding(.horizontal)
        }
    }

    // MARK: - Storage Info Section

    private var storageInfoSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Storage Information")
                .font(.caption)
                .foregroundColor(.secondary)

            HStack {
                Text("Available Space:")
                Spacer()
                Text("\(modelManager.getAvailableStorageInMB())MB")
                    .foregroundColor(.secondary)
            }
            .font(.caption)

            Text("The model downloads once and works offline. You can delete it anytime in settings.")
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(UIColor.secondarySystemGroupedBackground))
        .cornerRadius(8)
    }

    // MARK: - Actions

    private func startDownload() {
        modelManager.startDownload(modelSize: selectedModel, allowCellular: allowCellularDownload)
    }
}

// MARK: - Model Card

struct ModelCard: View {
    let model: ModelSize
    let isSelected: Bool
    let isRecommended: Bool
    let availableStorage: Int
    let onTap: () -> Void

    private var hasEnoughStorage: Bool {
        availableStorage > (model.sizeInMB + 500)
    }

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Text(model.displayName)
                                .font(.headline)

                            if isRecommended {
                                Text("RECOMMENDED")
                                    .font(.caption2.bold())
                                    .foregroundColor(.white)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 3)
                                    .background(Color.green)
                                    .cornerRadius(4)
                            }
                        }

                        Text("\(model.sizeInMB)MB download")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }

                    Spacer()

                    if isSelected {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(Color(red: 0.176, green: 0.416, blue: 0.416))
                            .font(.title2)
                    } else {
                        Image(systemName: "circle")
                            .foregroundColor(.secondary)
                            .font(.title2)
                    }
                }

                Text(model.description)
                    .font(.caption)
                    .foregroundColor(.secondary)

                Divider()

                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Image(systemName: "iphone")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text(model.recommendedDevices)
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }

                    if !hasEnoughStorage {
                        HStack {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .font(.caption)
                                .foregroundColor(.orange)
                            Text("Not enough storage available")
                                .font(.caption2)
                                .foregroundColor(.orange)
                        }
                    }
                }
            }
            .padding()
            .background(isSelected ? Color(red: 0.176, green: 0.416, blue: 0.416).opacity(0.1) : Color(UIColor.secondarySystemGroupedBackground))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isSelected ? Color(red: 0.176, green: 0.416, blue: 0.416) : Color.clear, lineWidth: 2)
            )
            .cornerRadius(12)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

#Preview {
    ModelDownloadView(hasModel: .constant(false))
}
