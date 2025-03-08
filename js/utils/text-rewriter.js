/**
 * TextRewriter - Provides methods to transform extractive summaries into more abstractive ones
 * by leveraging LLM capabilities
 */
const TextRewriter = (() => {
  // Minimal set of filler phrases to remove for basic text cleanup
  const REMOVABLE_PHRASES = [
    'it is important to note that', 'it should be noted that', 'it is worth noting that',
    'as a matter of fact', 'as you can see', 'in other words', 'in this case'
    // Keep this list minimal since we'll rely more on the LLM
  ];
  
  // Basic text cleanup (minimal since we'll use the LLM for better rewrites)
  function basicTextCleanup(text) {
    if (!text) return "";
    
    let result = text;
    
    // Remove common filler phrases
    REMOVABLE_PHRASES.forEach(phrase => {
      result = result.replace(new RegExp(phrase, 'gi'), '');
    });
    
    // Fix spacing issues
    result = result.replace(/\s+([,.;:])/g, '$1');
    result = result.replace(/\s{2,}/g, ' ').trim();
    
    // Ensure proper capitalization of first character
    if (result.length > 0) {
      result = result.charAt(0).toUpperCase() + result.slice(1);
    }
    
    return result;
  }
  
  // Basic connection of sentences without using transitional phrases
  function addBasicTransitions(sentences) {
    if (sentences.length <= 1) return sentences;
    
    // Instead of adding transitional phrases, simply return the original sentences
    // This creates a more direct style without linking words
    return sentences.map((sentence, index) => {
      return sentence;
    });
  }
  
  return {
    /**
     * Transform an extractive summary into a more abstractive one using LLM
     */
    async transformSummary(extractiveSummary) {
      // Basic validation
      if (!extractiveSummary) return "";
      
      try {
        // If LLM handler is available, use it
        if (typeof LLMHandler !== 'undefined') {
          // Analyze the content to determine approach
          const analysis = LLMHandler.analyzeContent(extractiveSummary);
          
          // Use the LLM to generate an improved summary
          return await LLMHandler.generateSummary(extractiveSummary, {
            contentType: analysis.contentType,
            keepLength: true
          });
        } 
        // Fallback to basic processing if LLM not available
        else {
          const sentences = extractiveSummary.match(/[^.!?]+[.!?]+/g) || [];
          
          // Apply basic cleanup to each sentence
          const cleanedSentences = sentences.map(s => basicTextCleanup(s));
          
          // Add basic transitions
          const withTransitions = addBasicTransitions(cleanedSentences);
          
          return withTransitions.join(' ');
        }
      } catch (error) {
        console.error("Error in transformSummary:", error);
        // Return basic cleaned version if error occurs
        return basicTextCleanup(extractiveSummary);
      }
    },
    
    /**
     * Create a genuinely abstractive summary using LLM and key elements
     */
    async generateAbstractiveSummary(keyElements, extractedText, numSentences = 3) {
      try {
        // If LLM handler is available, use it for an abstractive summary
        if (typeof LLMHandler !== 'undefined') {
          // First, get a basic summary
          const analysis = LLMHandler.analyzeContent(extractedText);
          const basicSummary = await LLMHandler.generateSummary(extractedText, {
            contentType: analysis.contentType,
            sentenceCount: numSentences
          });
          
          // Then enhance it with key elements
          return await LLMHandler.enhanceSummary(basicSummary, keyElements, {
            contentType: analysis.contentType
          });
        }
        // Fallback to extract key sentences if LLM not available
        else {
          // Use key elements to extract important sentences
          const keyTerms = [...(keyElements.themes || []), ...(keyElements.entities || [])]
            .map(item => typeof item === 'string' ? item : item.text);
            
          const sentences = extractedText.match(/[^.!?]+[.!?]+/g) || [];
          
          // Score sentences based on key terms
          const scoredSentences = sentences.map(sentence => {
            let score = 0;
            keyTerms.forEach(term => {
              if (sentence.toLowerCase().includes(term.toLowerCase())) score += 1;
            });
            return { sentence, score };
          });
          
          // Select top sentences
          const selected = scoredSentences
            .sort((a, b) => b.score - a.score)
            .slice(0, numSentences)
            .map(item => basicTextCleanup(item.sentence));
            
          return addBasicTransitions(selected).join(' ');
        }
      } catch (error) {
        console.error("Error in generateAbstractiveSummary:", error);
        // Return basic extractive summary if error occurs
        return extractedText.split('.').slice(0, numSentences).join('.') + '.';
      }
    },
    
    // Minimal cleanup function exposed for other modules
    compressSentence(sentence) {
      return basicTextCleanup(sentence);
    }
  };
})();
