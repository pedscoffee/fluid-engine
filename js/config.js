export const config = {
    // WebLLM Model ID
    // Using Llama 3.2 3B Instruct - good balance of size/quality for browser
    modelId: "Llama-3.2-3B-Instruct-q4f16_1-MLC",

    // Whisper Model ID
    // Using whisper-small for significantly better accuracy on M3 MacBook Air
    // Model size: ~244MB (cached after first load)
    whisperModel: "Xenova/whisper-small",

    // TTS Settings
    ttsLang: "es-ES", // Default to Spain Spanish, can be changed to es-MX
    ttsRate: 1.0,
    ttsPitch: 1.0
};
