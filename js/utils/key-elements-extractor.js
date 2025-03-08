/**
 * Key Elements Extractor - Extracts key themes, entities, and important points from text
 */
const KeyElementsExtractor = (() => {
  // Helper function to tag parts of speech
  function tagPartsOfSpeech(text) {
    // Simulated POS tagging
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    return sentences.map(sentence => ({
      sentence,
      words: sentence.split(' ').map((word, index) => ({
        word,
        original: word,
        tag: index % 5 === 0 ? 'NOUN' : 'OTHER',
        isSentenceStart: index === 0
      }))
    }));
  }

  // Helper function to calculate TF-IDF scores
  function calculateTFIDF(taggedSentences) {
    const termFrequency = {};
    const documentFrequency = {};
    const totalDocuments = taggedSentences.length;

    taggedSentences.forEach(sentence => {
      const seenTerms = new Set();
      sentence.words.forEach(word => {
        const term = word.word.toLowerCase();
        termFrequency[term] = (termFrequency[term] || 0) + 1;
        if (!seenTerms.has(term)) {
          documentFrequency[term] = (documentFrequency[term] || 0) + 1;
          seenTerms.add(term);
        }
      });
    });

    const tfidfScores = {};
    Object.keys(termFrequency).forEach(term => {
      const tf = termFrequency[term];
      const df = documentFrequency[term];
      const idf = Math.log(totalDocuments / (df + 1));
      tfidfScores[term] = tf * idf;
    });

    return tfidfScores;
  }

  /**
   * Extract n-grams (word sequences) from text with filtering
   */
  function extractQualityNgrams(taggedSentences, n) {
    const ngrams = {};
    
    taggedSentences.forEach(sentence => {
      const words = sentence.words;
      
      for (let i = 0; i <= words.length - n; i++) {
        const sequence = words.slice(i, i + n);
        
        // Skip sequences with too many stopwords
        const stopwordCount = sequence.filter(w => w.tag === 'STOP').length;
        if (stopwordCount > n / 2) continue;
        
        // Only keep sequences with at least one noun or proper noun
        if (!sequence.some(w => ['NOUN', 'PROPN'].includes(w.tag))) continue;
        
        // Reconstruct the phrase
        const phrase = sequence.map(w => w.original).join(' ');
        ngrams[phrase] = (ngrams[phrase] || 0) + 1;
      }
    });
    
    return ngrams;
  }

  /**
   * Categorize text elements into semantic groups
   */
  function categorizeElements(themes, entities) {
    const categories = {
      'technology': ['digital', 'online', 'technology', 'social media', 'platforms', 'machine learning', 
                    'algorithms', 'internet', 'computer', 'software', 'devices', 'app'],
      'communication': ['communication', 'information', 'media', 'content', 'message', 'exchange',
                       'sharing', 'discussion', 'chat', 'conversation', 'expression'],
      'education': ['education', 'learning', 'teaching', 'students', 'school', 'university', 
                   'knowledge', 'academic', 'study', 'research', 'training'],
      'business': ['business', 'company', 'industry', 'market', 'product', 'service', 
                  'customer', 'client', 'organization', 'management', 'strategy'],
      'science': ['science', 'scientific', 'research', 'analysis', 'experiment', 'theory',
                 'hypothesis', 'method', 'data', 'results', 'findings']
    };
    
    const result = {};
    
    // Check each theme against categories
    [...themes, ...entities].forEach(item => {
      const text = typeof item === 'string' ? item : item.text;
      const lowerText = text.toLowerCase();
      
      for (const [category, keywords] of Object.entries(categories)) {
        if (keywords.some(keyword => lowerText.includes(keyword))) {
          if (!result[category]) result[category] = [];
          result[category].push(item);
          break;
        }
      }
      
      // Add to 'other' if no category matched
      if (!Object.values(result).flat().includes(item)) {
        if (!result['other']) result['other'] = [];
        result['other'].push(item);
      }
    });
    
    return result;
  }

  // Helper function to extract sentences containing keywords
  function extractSentencesWithKeywords(text, keywords, maxSentences = 5) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    
    const scoredSentences = sentences.map(sentence => {
      let score = 0;
      
      keywords.forEach(keyword => {
        if (sentence.toLowerCase().includes(keyword.toLowerCase())) {
          score += 1;
        }
      });
      
      return { sentence: sentence.trim(), score };
    });
    
    return scoredSentences
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSentences)
      .map(item => item.sentence);
  }

  return {
    extractKeyElements(text) {
      // Step 1: Tag the text with parts of speech
      const taggedSentences = tagPartsOfSpeech(text);
      
      // Step 2: Calculate TF-IDF for important term identification
      const tfidfScores = calculateTFIDF(taggedSentences);
      
      // Step 3: Extract high-quality n-grams (phrases)
      const bigrams = extractQualityNgrams(taggedSentences, 2);
      const trigrams = extractQualityNgrams(taggedSentences, 3);
      
      // Step 4: Find the maximum scores for normalization
      const singleTermScores = Object.entries(tfidfScores)
        .filter(([term]) => term.length > 3)
        .sort((a, b) => b[1] - a[1]);
        
      const maxSingleTermScore = singleTermScores.length > 0 ? singleTermScores[0][1] : 1;
      
      const bigramScores = Object.entries(bigrams)
        .sort((a, b) => b[1] - a[1]);
        
      const maxBigramScore = bigramScores.length > 0 ? bigramScores[0][1] * 1.5 : 1;
      
      const trigramScores = Object.entries(trigrams)
        .sort((a, b) => b[1] - a[1]);
        
      const maxTrigramScore = trigramScores.length > 0 ? trigramScores[0][1] * 2 : 1;
      
      const maxScore = Math.max(maxSingleTermScore, maxBigramScore, maxTrigramScore);
      
      // Step 5: Create scored themes and entities
      const themes = [
        ...singleTermScores.slice(0, 5).map(([term, score]) => ({
          text: term,
          relevance: Math.ceil((score / maxScore) * 5)
        })),
        ...bigramScores.slice(0, 5).map(([term, score]) => ({
          text: term,
          relevance: Math.ceil(((score * 1.5) / maxScore) * 5)
        })),
        ...trigramScores.slice(0, 3).map(([term, score]) => ({
          text: term,
          relevance: Math.ceil(((score * 2) / maxScore) * 5)
        }))
      ].sort((a, b) => b.relevance - a.relevance);
      
      // Step 6: Extract entities (proper nouns)
      const entities = [];
      const entityCounts = {};
      
      taggedSentences.forEach(sentence => {
        sentence.words.forEach(word => {
          if (word.tag === 'PROPN' && !word.isSentenceStart && word.word.length > 1) {
            entityCounts[word.word] = (entityCounts[word.word] || 0) + 1;
          }
        });
      });
      
      // Convert entity counts to scored entities
      Object.entries(entityCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .forEach(([entity, count]) => {
          entities.push({
            text: entity,
            relevance: Math.min(5, Math.max(1, count))
          });
        });
      
      // Step 7: Categorize themes and entities
      const categorized = categorizeElements(themes, entities);
      
      // Step 8: Extract key sentences containing themes and entities
      const keyTerms = themes.map(theme => theme.text);
      const keyPoints = extractSentencesWithKeywords(text, keyTerms);
      
      return {
        themes,
        entities,
        categories: categorized,
        terms: singleTermScores.slice(5, 15).map(([term, score]) => ({
          text: term,
          relevance: Math.ceil((score / maxScore) * 5)
        })),
        keyPoints
      };
    }
  };
})();

// No export statement - it's globally available