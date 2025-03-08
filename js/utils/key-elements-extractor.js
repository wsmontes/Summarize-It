/**
 * Key Elements Extractor - Extracts key themes, entities, and important points from text
 */
const KeyElementsExtractor = (() => {
  // Extended stopwords list to filter out common non-meaningful terms
  const STOPWORDS = new Set([
    'a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'by', 'is', 'are', 'was', 
    'were', 'be', 'been', 'being', 'in', 'that', 'this', 'it', 'of', 'from', 'with', 'as', 'have', 
    'has', 'had', 'not', 'what', 'when', 'where', 'who', 'why', 'how', 'all', 'any', 'both', 'each', 
    'few', 'more', 'most', 'other', 'some', 'such', 'than', 'too', 'very', 'can', 'will', 'just',
    'should', 'now', 'into', 'only', 'itself', 'himself', 'herself', 'myself', 'yourself', 'themselves',
    'ourselves', 'its', 'his', 'hers', 'your', 'my', 'their', 'our', 'these', 'those', 'they', 'we', 
    'he', 'she', 'you', 'me', 'him', 'her', 'them', 'us', 'there', 'here', 'would', 'could', 'should',
    'shall', 'might', 'may', 'must', 'about', 'within', 'without', 'throughout', 'through', 'during',
    'before', 'after', 'above', 'below', 'up', 'down', 'over', 'under'
  ]);

  // Helper function to tag parts of speech - improved version
  function tagPartsOfSpeech(text) {
    // Split text into sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    
    // Simple rules for POS tagging, improved over previous version
    return sentences.map(sentence => {
      const words = sentence.match(/\b[\w'-]+\b/g) || [];
      
      // Track if previous word was a determiner, adjective, etc.
      let prevCategory = null;
      
      return {
        sentence,
        words: words.map((word, index) => {
          const lowerWord = word.toLowerCase();
          const isCapitalized = word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase();
          const isStopword = STOPWORDS.has(lowerWord);
          
          // Determine word category
          let tag = 'OTHER';
          
          // Proper nouns - capitalized words not at the start
          if (isCapitalized && index > 0) {
            tag = 'PROPN';
          }
          // Common nouns
          else if (lowerWord.match(/(?:tion|ment|ity|ness|ship|dom|ence|ance|ism|ing)$/)) {
            tag = 'NOUN';
          }
          // After determiners, likely a noun
          else if (prevCategory === 'DET' && !isStopword) {
            tag = 'NOUN';
          }
          // Adjectives
          else if (lowerWord.match(/(?:able|ible|al|ful|ic|ive|less|ous)$/)) {
            tag = 'ADJ';
            prevCategory = 'ADJ';
          }
          // Determiners
          else if (['the', 'a', 'an', 'this', 'that', 'these', 'those'].includes(lowerWord)) {
            tag = 'DET';
            prevCategory = 'DET';
          }
          // Stopwords
          else if (isStopword) {
            tag = 'STOP';
          }
          // Default to NOUN for unknown words (most common)
          else if (index > 0) {
            tag = 'NOUN';
          }
          
          return {
            word,
            original: word,
            tag,
            isStopword,
            isSentenceStart: index === 0,
            isCapitalized
          };
        })
      };
    });
  }

  // Helper function to calculate TF-IDF scores
  function calculateTFIDF(taggedSentences) {
    const termFrequency = {};
    const documentFrequency = {};
    const totalDocuments = taggedSentences.length;

    taggedSentences.forEach(sentence => {
      const seenTerms = new Set();
      sentence.words.forEach(word => {
        if (word.isStopword) return; // Skip stopwords 
        
        const term = word.word.toLowerCase();
        
        // Only count terms with min length
        if (term.length < 3) return;
        
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
   * Extract n-grams (word sequences) from text with improved filtering
   */
  function extractQualityNgrams(taggedSentences, n) {
    const ngrams = {};
    
    taggedSentences.forEach(sentence => {
      const words = sentence.words;
      
      for (let i = 0; i <= words.length - n; i++) {
        const sequence = words.slice(i, i + n);
        
        // Skip if first or last word is a stopword
        if (sequence[0].isStopword || sequence[n-1].isStopword) continue;
        
        // Skip sequences with too many stopwords
        const stopwordCount = sequence.filter(w => w.isStopword).length;
        if (stopwordCount > Math.floor(n/3)) continue;
        
        // Keep only sequences that have at least one meaningful noun or adjective
        const hasNoun = sequence.some(w => ['NOUN', 'PROPN'].includes(w.tag));
        if (!hasNoun) continue;
        
        // Reconstruct the phrase
        const phrase = sequence.map(w => w.original).join(' ');
        
        // Skip very short phrases that aren't meaningful
        if (phrase.length < n * 2 && n > 1) continue;
        
        ngrams[phrase] = (ngrams[phrase] || 0) + 1;
      }
    });
    
    return ngrams;
  }

  /**
   * Categorize text elements into semantic groups - improved categories
   */
  function categorizeElements(themes, entities) {
    const categories = {
      'technology': [
        'digital', 'online', 'technology', 'social media', 'platform', 'machine', 'algorithm',
        'internet', 'computer', 'software', 'device', 'app', 'artificial intelligence', 
        'ai', 'tech', 'web', 'electronic', 'data', 'system', 'network', 'mobile'
      ],
      'communication': [
        'communication', 'information', 'media', 'content', 'message', 'exchange',
        'sharing', 'discuss', 'chat', 'conversation', 'expression', 'article', 'news',
        'document', 'text', 'write', 'read', 'language', 'sentence', 'word'
      ],
      'information processing': [
        'process', 'distill', 'summarize', 'summarization', 'extract', 'capture', 
        'identify', 'analyze', 'understand', 'summary', 'key point', 'essence', 
        'important', 'critical', 'essential', 'natural language processing'
      ],
      'education': [
        'education', 'learning', 'teaching', 'student', 'school', 'university', 
        'knowledge', 'academic', 'study', 'research', 'training'
      ]
    };
    
    const result = {};
    
    // Check each theme against categories with improved matching
    [...themes, ...entities].forEach(item => {
      const text = typeof item === 'string' ? item : item.text;
      const lowerText = text.toLowerCase();
      let matched = false;
      
      for (const [category, keywords] of Object.entries(categories)) {
        // Check for each keyword as part of the theme/entity
        if (keywords.some(keyword => {
          // Match whole words or word stems
          const regex = new RegExp(`\\b${keyword}|${keyword}s?\\b|${keyword}ing\\b|${keyword}ed\\b`);
          return regex.test(lowerText);
        })) {
          if (!result[category]) result[category] = [];
          result[category].push(item);
          matched = true;
          break;
        }
      }
      
      // Add to 'other' if no category matched
      if (!matched) {
        if (!result['other']) result['other'] = [];
        result['other'].push(item);
      }
    });
    
    return result;
  }

  // Helper function to extract sentences containing keywords - improved scoring
  function extractSentencesWithKeywords(text, keywords, maxSentences = 5) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    
    const scoredSentences = sentences.map((sentence, index) => {
      let score = 0;
      const lowerSentence = sentence.toLowerCase();
      
      // Base score for position in text
      if (index === 0) score += 2; // Introduction often important
      if (index === sentences.length - 1) score += 1.5; // Conclusion often important
      
      // Score based on keywords
      keywords.forEach(keyword => {
        const keywordLower = keyword.toLowerCase();
        if (lowerSentence.includes(keywordLower)) {
          // More score for exact matches
          score += 1;
          
          // Additional score for keywords appearing early in the sentence
          if (lowerSentence.indexOf(keywordLower) < lowerSentence.length / 2) {
            score += 0.5;
          }
        }
      });
      
      // Score based on sentence length (prefer medium-length sentences)
      const wordCount = sentence.split(/\s+/).length;
      if (wordCount >= 10 && wordCount <= 25) {
        score += 0.5; // Bonus for "just right" sentences
      } else if (wordCount > 40) {
        score -= 1; // Penalty for very long sentences
      }
      
      return { sentence: sentence.trim(), score, index };
    });
    
    return scoredSentences
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSentences)
      .sort((a, b) => a.index - b.index)
      .map(item => item.sentence);
  }

  // Improved phrase filtering
  function filterMeaningfulPhrases(candidates, minLength = 2) {
    return candidates.filter(([phrase, _]) => {
      // Filter out phrases that are too short
      if (phrase.length < minLength * 3) return false;
      
      // Filter out phrases that are just stopwords
      const words = phrase.toLowerCase().split(/\s+/);
      if (words.every(word => STOPWORDS.has(word))) return false;
      
      // Filter out incomplete phrases that end with stopwords
      const lastWord = words[words.length - 1];
      if (STOPWORDS.has(lastWord) && words.length <= 3) return false;
      
      return true;
    });
  }

  return {
    extractKeyElements(text) {
      // Step 1: Tag the text with parts of speech - improved tagging
      const taggedSentences = tagPartsOfSpeech(text);
      
      // Step 2: Calculate TF-IDF for important term identification
      const tfidfScores = calculateTFIDF(taggedSentences);
      
      // Step 3: Extract high-quality n-grams (phrases)
      const bigrams = extractQualityNgrams(taggedSentences, 2);
      const trigrams = extractQualityNgrams(taggedSentences, 3);
      const quadgrams = extractQualityNgrams(taggedSentences, 4);
      
      // Step 4: Find the maximum scores for normalization with filtering
      const singleTermScores = Object.entries(tfidfScores)
        .filter(([term]) => term.length > 3 && !STOPWORDS.has(term.toLowerCase()))
        .sort((a, b) => b[1] - a[1]);
        
      const maxSingleTermScore = singleTermScores.length > 0 ? singleTermScores[0][1] : 1;
      
      const filteredBigrams = filterMeaningfulPhrases(Object.entries(bigrams), 2);
      const bigramScores = filteredBigrams.sort((a, b) => b[1] - a[1]);
      const maxBigramScore = bigramScores.length > 0 ? bigramScores[0][1] * 1.5 : 1;
      
      const filteredTrigrams = filterMeaningfulPhrases(Object.entries(trigrams), 3);
      const trigramScores = filteredTrigrams.sort((a, b) => b[1] - a[1]);
      const maxTrigramScore = trigramScores.length > 0 ? trigramScores[0][1] * 2 : 1;
      
      const filteredQuadgrams = filterMeaningfulPhrases(Object.entries(quadgrams), 4);
      const quadgramScores = filteredQuadgrams.sort((a, b) => b[1] - a[1]);
      const maxQuadgramScore = quadgramScores.length > 0 ? quadgramScores[0][1] * 2.5 : 1;
      
      const maxScore = Math.max(maxSingleTermScore, maxBigramScore, maxTrigramScore, maxQuadgramScore);
      
      // Step 5: Create scored themes and entities - prioritize longer phrases
      const themes = [
        ...quadgramScores.slice(0, 3).map(([term, score]) => ({
          text: term,
          relevance: Math.ceil(((score * 2.5) / maxScore) * 5)
        })),
        ...trigramScores.slice(0, 4).map(([term, score]) => ({
          text: term,
          relevance: Math.ceil(((score * 2) / maxScore) * 5)
        })),
        ...bigramScores.slice(0, 5).map(([term, score]) => ({
          text: term,
          relevance: Math.ceil(((score * 1.5) / maxScore) * 5)
        })),
        ...singleTermScores.slice(0, 3).map(([term, score]) => ({
          text: term,
          relevance: Math.ceil((score / maxScore) * 5)
        }))
      ].sort((a, b) => b.relevance - a.relevance);
      
      // Step 6: Extract entities (proper nouns)
      const entities = [];
      const entityCounts = {};
      const entityPhrases = {};
      
      // Collect entities with their context
      taggedSentences.forEach(sentence => {
        let currentEntity = [];
        
        for (let i = 0; i < sentence.words.length; i++) {
          const word = sentence.words[i];
          
          // Start or continue an entity
          if (word.tag === 'PROPN' || 
              (currentEntity.length > 0 && word.isCapitalized && !word.isSentenceStart)) {
            currentEntity.push(word.original);
          } 
          // End an entity
          else if (currentEntity.length > 0) {
            const entityText = currentEntity.join(' ');
            entityCounts[entityText] = (entityCounts[entityText] || 0) + 1;
            currentEntity = [];
          }
        }
        
        // Handle any remaining entity at end of sentence
        if (currentEntity.length > 0) {
          const entityText = currentEntity.join(' ');
          entityCounts[entityText] = (entityCounts[entityText] || 0) + 1;
        }
        
        // Also look for technical terms and domain-specific vocabulary
        const text = sentence.sentence.toLowerCase();
        const technicalTerms = [
          'natural language processing', 'machine learning', 'artificial intelligence',
          'text summarization', 'information retrieval', 'information extraction',
          'text analytics', 'neural networks', 'deep learning', 'nlp', 'ai'
        ];
        
        technicalTerms.forEach(term => {
          if (text.includes(term)) {
            entityCounts[term] = (entityCounts[term] || 0) + 1;
          }
        });
      });
      
      // Convert entity counts to scored entities
      Object.entries(entityCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .filter(([entity, _]) => entity.length > 2 && !STOPWORDS.has(entity.toLowerCase()))
        .forEach(([entity, count]) => {
          entities.push({
            text: entity,
            relevance: Math.min(5, Math.max(1, count + 2))  // Boost entity relevance
          });
        });
      
      // Step 7: Categorize themes and entities with improved categorization
      const categorized = categorizeElements(themes, entities);
      
      // Step 8: Extract key sentences containing themes and entities
      const keyTerms = [...themes, ...entities].map(theme => 
        typeof theme === 'string' ? theme : theme.text
      );
      const keyPoints = extractSentencesWithKeywords(text, keyTerms);
      
      return {
        themes,
        entities,
        categories: categorized,
        terms: singleTermScores.slice(3, 12).map(([term, score]) => ({
          text: term,
          relevance: Math.ceil((score / maxScore) * 5)
        })),
        keyPoints
      };
    }
  };
})();

// No export statement - it's globally available