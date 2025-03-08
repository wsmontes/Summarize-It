/**
 * ML Summarizer - Uses TensorFlow.js with multiple model options
 */
const MLSummarizer = (() => {
  let currentModel = null;
  let currentModelId = null;
  let isLoading = false;
  
  // Update loading progress bar
  function updateProgress(percent) {
    document.getElementById('loadingProgress').style.width = `${percent}%`;
  }
  
  // Update model status message
  function updateModelStatus(message) {
    const statusDiv = document.querySelector('#modelStatus div:first-child');
    statusDiv.textContent = `Model status: ${message}`;
  }
  
  // Load the selected model
  async function loadModel(modelId) {
    if (currentModel && currentModelId === modelId) return currentModel;
    if (isLoading) return null;
    
    const modelInfo = ModelRegistry.getModel(modelId);
    
    isLoading = true;
    updateModelStatus(`Loading ${modelInfo.name}...`);
    updateProgress(10);
    
    try {
      // Configure model loading
      TFModels.tf.env().set('WEBGL_PACK', false); // For better compatibility
      
      // Progressively load the model
      currentModel = await modelInfo.loadFunction();
      currentModelId = modelId;
      
      updateProgress(100);
      updateModelStatus(`${modelInfo.name} loaded and ready`);
      
      return currentModel;
    } catch (error) {
      console.error("Error loading model:", error);
      updateModelStatus(`Error: ${error.message}`);
      updateProgress(0);
      return null;
    } finally {
      isLoading = false;
    }
  }
  
  // Calculate cosine similarity between two vectors
  function cosineSimilarity(vecA, vecB) {
    return TFModels.tf.tidy(() => {
      const dotProduct = TFModels.tf.sum(TFModels.tf.mul(vecA, vecB));
      const normA = TFModels.tf.norm(vecA);
      const normB = TFModels.tf.norm(vecB);
      return dotProduct.div(TFModels.tf.mul(normA, normB));
    });
  }
  
  // Private methods
  function splitIntoSentences(text) {
    return text
      .replace(/([.!?])\s+(?=[A-Z])/g, "$1|")
      .replace(/\n+/g, "|")
      .split("|")
      .map(s => s.trim())
      .filter(s => s.length > 10);
  }
  
  // Public API
  return {
    async isModelAvailable(modelId) {
      if (currentModel && currentModelId === modelId) return true;
      try {
        await loadModel(modelId);
        return !!currentModel;
      } catch (e) {
        return false;
      }
    },
    
    async summarize(text, modelId, numSentences = 3) {
      const modelInfo = ModelRegistry.getModel(modelId);
      
      // Check if this is a placeholder model
      if (modelInfo.isPlaceholder) {
        throw new Error("Please select a summarization model first");
      }
      
      // Special handling for LLM-based model
      if (modelInfo.usesLLM && typeof LLMHandler !== 'undefined') {
        updateModelStatus("Processing with LLM...");
        updateProgress(50);
        
        try {
          // Use the LLM handler for summarization
          const analysis = LLMHandler.analyzeContent(text);
          const summary = await LLMHandler.generateSummary(text, {
            contentType: analysis.contentType,
            sentenceCount: numSentences
          });
          
          updateProgress(100);
          updateModelStatus("Ready for next summary");
          
          return summary;
        } catch (error) {
          console.error("LLM processing error:", error);
          throw new Error(`Error with LLM processing: ${error.message}`);
        }
      }
      
      // If this isn't an ML model, use the statistical approach instead
      if (!modelInfo.usesML) {
        return TextSummarizer.summarize(text, numSentences);
      }
      
      // For premium models like GPT-2, BART, T5, use more advanced abstractive simulation
      const useAbstractive = ['gpt2', 'bart', 't5'].includes(modelId);
      
      // For these models, extract more sentences than needed for better material to rewrite
      const extractionSentences = useAbstractive ? Math.min(numSentences * 2, 10) : numSentences;
      
      // For GPT-2, we would do more abstractive summarization
      // For this demo, we'll simulate different behavior for different model types
      if (modelId === 'gpt2' || modelId === 'bart' || modelId === 't5') {
        // These would typically do abstractive summarization
        // For the demo, we'll just add a simulated delay and then use extractive
        await new Promise(resolve => setTimeout(resolve, modelId === 'gpt2' ? 2000 : 1000));
      }
      
      // Step 1: Split text into sentences
      const sentences = splitIntoSentences(text);
      
      if (sentences.length <= numSentences) {
        return text;  // Text already short enough
      }
      
      // Step 2: Ensure model is loaded
      if (!currentModel || currentModelId !== modelId) {
        updateProgress(30);
        currentModel = await loadModel(modelId);
        if (!currentModel) {
          throw new Error(`Failed to load the ${modelInfo.name} model. Try another model or switch to local processing.`);
        }
      }
      
      updateModelStatus("Encoding sentences...");
      updateProgress(50);
      
      // Step 3: Process depending on model type
      let sentenceVectors;
      
      try {
        if (modelId === 'use') {
          // Universal Sentence Encoder approach
          const embeddings = await currentModel.embed(sentences);
          sentenceVectors = await embeddings.array();
        } 
        else if (['mobilebert', 'tinybert', 'bert', 'gpt2', 'bart', 't5'].includes(modelId)) {
          // For demo purposes, we're simulating various models
          // In a real implementation, you'd use the actual model's API
          const embeddings = await (currentModel.embed ? 
            currentModel.embed(sentences) : 
            TFModels.use.load().then(model => model.embed(sentences)));
          sentenceVectors = await embeddings.array();
        }
        else {
          // Fallback for any other model type
          throw new Error(`Embedding method not implemented for model: ${modelInfo.name}`);
        }
        
        // Check if we have valid sentence vectors
        if (!sentenceVectors || !Array.isArray(sentenceVectors) || sentenceVectors.length === 0) {
          throw new Error("Failed to generate sentence embeddings");
        }
      } catch (error) {
        console.error("Embedding error:", error);
        throw new Error(`Error processing text with ${modelInfo.name}: ${error.message}`);
      }
      
      updateModelStatus("Computing similarities...");
      updateProgress(70);
      
      // Step 4: Compute similarity matrix
      const similarityMatrix = [];
      for (let i = 0; i < sentences.length; i++) {
        similarityMatrix[i] = [];
        for (let j = 0; j < sentences.length; j++) {
          if (i === j) {
            similarityMatrix[i][j] = 1.0; // Self-similarity
          } else {
            // Use TensorFlow.js to compute cosine similarity
            try {
              const similarity = await cosineSimilarity(
                TFModels.tf.tensor1d(sentenceVectors[i]), 
                TFModels.tf.tensor1d(sentenceVectors[j])
              ).array();
              
              similarityMatrix[i][j] = similarity;
            } catch (error) {
              console.error("Similarity calculation error:", error);
              // Fallback to a default similarity value if calculation fails
              similarityMatrix[i][j] = 0.1;
            }
          }
        }
      }
      
      updateModelStatus("Ranking sentences...");
      updateProgress(90);
      
      // Step 5: Apply TextRank algorithm
      const ITERATIONS = 10;
      const DAMPING = 0.85;
      let scores = Array(sentences.length).fill(1);
      
      for (let iter = 0; iter < ITERATIONS; iter++) {
        const newScores = Array(sentences.length).fill(0);
        
        for (let i = 0; i < sentences.length; i++) {
          for (let j = 0; j < sentences.length; j++) {
            if (i !== j) {
              const weight = similarityMatrix[j][i];
              newScores[i] += weight * scores[j];
            }
          }
          newScores[i] = (1 - DAMPING) + DAMPING * newScores[i];
        }
        
        scores = [...newScores];
      }
      
      updateModelStatus("Finalizing summary...");
      updateProgress(95);
      
      // Step 6: Select top sentences while preserving order
      const topSentences = sentences
        .map((sentence, index) => ({ sentence, score: scores[index], index }))
        .sort((a, b) => b.score - a.score)
        .slice(0, extractionSentences)
        .sort((a, b) => a.index - b.index)
        .map(item => item.sentence);
        
      const extractiveSummary = topSentences.join(' ');
      
      updateModelStatus("Enhancing summary...");
      updateProgress(98);
      
      // Step 7: Transform extractive summary into more abstractive text
      let finalSummary;
      
      // Professional models get more abstractive rewrites
      if (useAbstractive) {
        // Extract key elements for better abstractive generation
        const keyElements = KeyElementsExtractor.extractKeyElements(text);
        
        // Simulate advanced abstractive summarization
        if (modelId === 'gpt2') {
          // GPT-2 would generate the most fluent and abstractive text
          finalSummary = TextRewriter.generateAbstractiveSummary(keyElements, extractiveSummary, numSentences);
        } else {
          // BART and T5 are also very good at abstraction
          finalSummary = TextRewriter.transformSummary(extractiveSummary.split('. ')
            .slice(0, numSentences)
            .join('. '));
        }
      } else {
        // For standard models, just do basic sentence compression
        finalSummary = extractiveSummary.split('. ')
          .slice(0, numSentences)
          .map(s => TextRewriter.compressSentence ? TextRewriter.compressSentence(s) : s)
          .join('. ');
      }
      
      updateModelStatus("Ready for next summary");
      updateProgress(100);
      
      return finalSummary;
    }
  };
})();

// No export statement - globally available
