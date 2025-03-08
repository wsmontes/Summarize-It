/**
 * TextSummarizer - Core local summarization module (fallback)
 */
const TextSummarizer = (() => {
  // Private constants
  const STOPWORDS = new Set([
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 
    'any', 'are', 'aren\'t', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 
    'below', 'between', 'both', 'but', 'by', 'can\'t', 'cannot', 'could', 'couldn\'t', 
    'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during', 
    'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 
    'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 
    'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 
    'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 
    'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my', 'myself', 'no', 'nor', 'not', 'of', 
    'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 
    'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 
    'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs', 
    'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 
    'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 
    'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 
    'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 
    'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t', 'you', 
    'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves'
  ]);
  
  const ITERATIONS = 10;
  const DAMPING = 0.85;
  
  // Private methods
  function splitIntoSentences(text) {
    return text
      .replace(/([.!?])\s+(?=[A-Z])/g, "$1|")
      .replace(/\n+/g, "|")
      .split("|")
      .map(s => s.trim())
      .filter(s => s.length > 10);
  }
  
  function preprocess(sentence) {
    return sentence
      .toLowerCase()
      .replace(/[^\w\s]|_/g, "")
      .split(/\s+/)
      .filter(word => word.length > 1 && !STOPWORDS.has(word));
  }
  
  function calculateSimilarity(words1, words2) {
    if (words1.length === 0 || words2.length === 0) return 0;
    
    // Use Sets for faster intersection calculation
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    // Calculate intersection size
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    
    // Normalize by the log of the product of set sizes
    return intersection.size / (Math.log(set1.size + 1) * Math.log(set2.size + 1));
  }
  
  // Public API
  return {
    summarize(text, numSentences = 3) {
      // Step 1: Split text into sentences
      const sentences = splitIntoSentences(text);
      
      if (sentences.length <= numSentences) {
        return text;  // Text already short enough
      }
      
      // Step 2: Preprocess each sentence
      const preprocessedSentences = sentences.map(preprocess);
      
      // Step 3: Build similarity matrix (optimization: store only upper triangular part)
      const similarities = {};
      for (let i = 0; i < sentences.length; i++) {
        for (let j = i + 1; j < sentences.length; j++) {
          const similarity = calculateSimilarity(
            preprocessedSentences[i],
            preprocessedSentences[j]
          );
          similarities[`${i}-${j}`] = similarity;
        }
      }
      
      // Step 4: Run TextRank algorithm
      const scores = Array(sentences.length).fill(1); // Initialize scores
      
      for (let iter = 0; iter < ITERATIONS; iter++) {
        const newScores = Array(sentences.length).fill(0);
        
        for (let i = 0; i < sentences.length; i++) {
          for (let j = 0; j < sentences.length; j++) {
            if (i !== j) {
              // Get similarity (check both directions in our stored matrix)
              let sim;
              if (i < j) {
                sim = similarities[`${i}-${j}`] || 0;
              } else {
                sim = similarities[`${j}-${i}`] || 0;
              }
              
              newScores[i] += sim * scores[j];
            }
          }
          newScores[i] = (1 - DAMPING) + DAMPING * newScores[i];
        }
        
        // Update scores
        for (let i = 0; i < scores.length; i++) {
          scores[i] = newScores[i];
        }
      }
      
      // Step 5: Select top sentences while preserving order
      const topSentences = sentences
        .map((sentence, index) => ({ sentence, score: scores[index], index }))
        .sort((a, b) => b.score - a.score)
        .slice(0, numSentences)
        .sort((a, b) => a.index - b.index)
        .map(item => item.sentence);
        
      // Step 6: Join selected sentences to create the extractive summary
      const extractiveSummary = topSentences.join(' ');
      
      // Step 7: Apply simple abstractive transformations if rewriter is available
      if (typeof TextRewriter !== 'undefined' && TextRewriter.transformSummary) {
        return TextRewriter.transformSummary(extractiveSummary);
      }
      
      return extractiveSummary;
    }
  };
})();

// No export statement - module will be available globally
