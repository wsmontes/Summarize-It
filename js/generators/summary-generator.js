/**
 * SummaryGenerator - Handles generating all types of summaries
 */
const SummaryGenerator = (() => {
  return {
    async generateAllSummaries(text, modelId, numSentences = 3) {
      // Step 1: Extract key elements
      const keyElements = KeyElementsExtractor.extractKeyElements(text);
      
      // Step 2: Generate basic summary (use existing code)
      let basicSummary;
      const modelInfo = ModelRegistry.getModel(modelId);
      
      if (modelInfo.usesML) {
        basicSummary = await MLSummarizer.summarize(text, modelId, numSentences);
      } else {
        basicSummary = TextSummarizer.summarize(text, numSentences);
      }
      
      // Step 3: Generate enhanced summary by combining insights
      const enhancedSummary = await this.generateEnhancedSummary(
        text, 
        basicSummary, 
        keyElements, 
        modelId, 
        Math.max(2, numSentences - 1)
      );
      
      return {
        keyElements,
        basicSummary,
        enhancedSummary
      };
    },
    
    async generateEnhancedSummary(text, basicSummary, keyElements, modelId, numSentences) {
      // For ML models that support abstractive summarization
      if (['gpt2', 'bart', 't5'].includes(modelId)) {
        // Generate a more abstractive summary using the rewriter
        return TextRewriter.generateAbstractiveSummary(keyElements, basicSummary, numSentences);
      } 
      // For extractive models, create an enhanced extractive summary with light rewriting
      else {
        // Use key elements to identify the most important sentences
        // The idea is to ensure coverage of key themes/entities
        
        // Split text into sentences
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
        
        // Score sentences based on presence of key elements
        const scoredSentences = sentences.map((sentence, index) => {
          let score = 0;
          
          // Check for themes
          keyElements.themes.forEach(theme => {
            const themeText = typeof theme === 'string' ? theme : theme.text;
            if (sentence.toLowerCase().includes(themeText.toLowerCase())) {
              score += 2;
            }
          });
          
          // Check for entities
          keyElements.entities.forEach(entity => {
            const entityText = typeof entity === 'string' ? entity : entity.text;
            if (sentence.toLowerCase().includes(entityText.toLowerCase())) {
              score += 1.5;
            }
          });
          
          // Boost score for sentences that are in the basic summary
          if (basicSummary.includes(sentence.trim())) {
            score += 3;
          }
          
          // Slight boost for early sentences (introduction)
          if (index < 2) {
            score += 0.5;
          }
          
          // Slight boost for concluding sentences
          if (index >= sentences.length - 2) {
            score += 0.5;
          }
          
          return { sentence, score, index };
        });
        
        // Select top sentences and preserve original order
        const topSentences = scoredSentences
          .sort((a, b) => b.score - a.score)
          .slice(0, numSentences)
          .sort((a, b) => a.index - b.index)
          .map(item => item.sentence.trim());
        
        // Apply abstractive transformations to the enhanced summary
        const extractiveSummary = topSentences.join(' ');
        return TextRewriter.transformSummary(extractiveSummary);
      }
    }
  };
})();

// No export statement - globally available
