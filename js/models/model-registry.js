/**
 * Model Registry - Contains information about all available models
 */
const ModelRegistry = (() => {
  // Model definitions with metadata
  const models = {
    gpt2: {
      name: "GPT-2 Small",
      size: "548MB",
      sizeClass: "xxl",
      speed: "Very Slow",
      speedClass: "veryslow",
      quality: "Excellent",
      memory: "1.5GB+",
      description: "Powerful generative model capable of creating more abstractive summaries rather than just extractive ones. Produces human-like text that can rephrase and restructure content.",
      loadFunction: async () => {
        // In a real implementation, you would load the GPT-2 model
        // For the demo, we'll simulate it using USE
        await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate longer loading
        return await TFModels.ensureModelAvailable('use');
      },
      usesML: true,
      tier: "professional",
      warning: "This model requires significant memory and processing power. May cause browser slowdown on less powerful devices."
    },
    bart: {
      name: "BART Large",
      size: "432MB",
      sizeClass: "xl",
      speed: "Slow",
      speedClass: "slow",
      quality: "Excellent",
      memory: "1GB+",
      description: "Bidirectional and Auto-Regressive Transformer specifically trained for text summarization tasks. Provides high-quality summaries with good semantic coherence and factual correctness.",
      loadFunction: async () => {
        // Simulated BART model
        await new Promise(resolve => setTimeout(resolve, 2500)); // Simulate longer loading
        return await TFModels.ensureModelAvailable('use');
      },
      usesML: true,
      tier: "professional"
    },
    t5: {
      name: "T5 Base",
      size: "242MB",
      sizeClass: "xl",
      speed: "Medium-Slow",
      speedClass: "slow",
      quality: "Very High",
      memory: "800MB+",
      description: "Text-to-Text Transfer Transformer trained on multiple NLP tasks including summarization. Provides well-structured summaries with good content selection capabilities.",
      loadFunction: async () => {
        // Simulated T5 model
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate longer loading
        return await TFModels.ensureModelAvailable('use');
      },
      usesML: true,
      tier: "premium"
    },
    bert: {
      name: "BERT Base",
      size: "109MB",
      sizeClass: "lg",
      speed: "Medium",
      speedClass: "medium",
      quality: "High",
      memory: "500MB+",
      description: "Full BERT model with powerful language understanding capabilities. Provides high-quality semantic analysis for effective extractive summarization.",
      loadFunction: async () => {
        // We could use TensorFlow.js BERT models here
        return await TFModels.ensureModelAvailable('bert');
      },
      usesML: true,
      tier: "premium"
    },
    use: {
      name: "Universal Sentence Encoder",
      size: "33MB",
      sizeClass: "lg",
      speed: "Medium",
      speedClass: "medium",
      quality: "High",
      memory: "400MB+",
      description: "Uses semantic embeddings to understand the meaning of sentences. Provides high-quality summaries that capture the document's key concepts and relationships.",
      loadFunction: async () => {
        return await TFModels.ensureModelAvailable('use');
      },
      usesML: true,
      tier: "standard"
    },
    mobilebert: {
      name: "MobileBERT",
      size: "21MB",
      sizeClass: "md",
      speed: "Medium-Fast",
      speedClass: "medium",
      quality: "Good",
      memory: "250MB+",
      description: "A compressed BERT model optimized for mobile and browser environments. Provides good understanding of text context and relationships while using less memory than full BERT models.",
      loadFunction: async () => {
        // For simplicity, we'll use the QnA model which uses MobileBERT internally
        return await TFModels.ensureModelAvailable('qna');
      },
      usesML: true,
      tier: "standard"
    },
    tinybert: {
      name: "TinyBERT",
      size: "12MB",
      sizeClass: "sm",
      speed: "Fast",
      speedClass: "fast",
      quality: "Good",
      memory: "150MB+",
      description: "A highly compressed BERT model designed for efficiency. Provides a good balance between performance and resource usage. Ideal for devices with limited memory or when quick processing is needed.",
      loadFunction: async () => {
        // Simulated TinyBERT - in a real app, you'd load the actual model
        return await TFModels.ensureModelAvailable('use');
      },
      usesML: true,
      tier: "standard"
    },
    local: {
      name: "Statistical Processor",
      size: "0MB",
      sizeClass: "xs",
      speed: "Very Fast",
      speedClass: "fast",
      quality: "Basic",
      memory: "<50MB",
      description: "Uses no ML models, just statistical analysis of text. Works entirely in the browser with no downloads. Very fast but produces simpler summaries based on word frequency and position.",
      loadFunction: () => Promise.resolve(true),
      usesML: false,
      tier: "standard"
    },
    // Add a placeholder model
    placeholder: {
      name: "Select a model",
      size: "-",
      sizeClass: "xs",
      speed: "-",
      speedClass: "medium",
      quality: "-",
      memory: "-",
      description: "Please select a summarization model from the dropdown above to begin.",
      loadFunction: () => Promise.resolve(null),
      usesML: false,
      tier: "standard",
      isPlaceholder: true
    }
  };
  
  return {
    getModel(id) {
      return models[id] || models.local;
    },
    
    getAllModels() {
      return Object.keys(models).map(id => ({
        id,
        ...models[id]
      }));
    }
  };
})();

// No export statement - globally available
