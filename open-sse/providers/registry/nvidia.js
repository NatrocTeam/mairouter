export default {
  id: "nvidia",
  priority: 20,
  hasFree: true,
  alias: "nvidia",
  display: {
    name: "NVIDIA NIM",
    icon: "developer_board",
    color: "#76B900",
    textIcon: "NV",
    website: "https://developer.nvidia.com/nim",
    notice: {
      text: "Free access for NVIDIA Developer Program members (prototyping & testing).",
      apiKeyUrl: "https://build.nvidia.com/settings/api-keys",
    },
  },
  category: "freeTier",
  transport: {
    baseUrl: "https://integrate.api.nvidia.com/v1/chat/completions",
    validateUrl: "https://integrate.api.nvidia.com/v1/models",
  },
  models: [
    { id: "deepseek-ai/deepseek-v4-flash", name: "DeepSeek V4 Flash" },
    { id: "deepseek-ai/deepseek-v4-pro", name: "DeepSeek V4 Pro" },
    { id: "minimaxai/minimax-m2.7", name: "Minimax M2.7" },
    {
      id: "nvidia/nemotron-3-ultra-550b-a55b",
      name: "NemoTron 3 Ultra 550B A55B",
    },
    { id: "qwen/qwen3.5-397b-a17b", name: "Qwen 3.5 397B A17B" },
    { id: "z-ai/glm-5.2", name: "GLM 5.2" },
    {
      id: "nvidia/nv-embed-v1",
      name: "NV-Embed V1",
      kind: "embedding",
    },
    {
      id: "nvidia/parakeet-ctc-1.1b-asr",
      name: "Parakeet CTC 1.1B",
      params: ["language"],
      kind: "stt",
    },
    { id: "fastpitch", name: "FastPitch", kind: "tts" },
    { id: "tacotron2", name: "Tacotron2", kind: "tts" },
  ],
  serviceKinds: ["llm", "tts", "embedding", "stt"],
  ttsConfig: {
    baseUrl: "https://integrate.api.nvidia.com/v1/audio/speech",
    authType: "apikey",
    authHeader: "bearer",
    format: "nvidia-tts",
  },
  embeddingConfig: {
    baseUrl: "https://integrate.api.nvidia.com/v1/embeddings",
    authType: "apikey",
    authHeader: "bearer",
  },
};
