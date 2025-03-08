/**
 * LLM Handler - Manages interactions with language models for advanced text processing
 */
const LLMHandler = (() => {
  // Configuration for different summarization approaches
  const PROMPT_TEMPLATES = {
    summarize: {
      basic: text => `Summarize the following text concisely:\n\n${text}`,
      formal: text => `Create a formal summary of the following text:\n\n${text}`,
      explanatory: text => `Explain the key points from this text:\n\n${text}`,
      creative: text => `Rewrite this content in a creative, engaging way while preserving the key information:\n\n${text}`,
      biographical: text => `Create a biographical summary focusing on the main person mentioned:\n\n${text}`,
    },
    
    enhance: {
      withThemes: (text, themes) => `Rewrite the following summary, incorporating these key themes: ${themes.join(", ")}.\n\nSummary: ${text}`,
      withEntities: (text, entities) => `Enhance this summary by highlighting the role of these entities: ${entities.join(", ")}.\n\nSummary: ${text}`,
      academic: text => `Rewrite this summary in a more academic style:\n\n${text}`,
      simplified: text => `Simplify this summary to make it more accessible:\n\n${text}`
    }
  };
  
  /**
   * Advanced text generation that simulates LLM capabilities
   * with better coherence and variety
   */
  async function processWithLLM(prompt, options = {}) {
    console.log("Processing with simulated LLM:", prompt.substring(0, 100) + "...");
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Extract text from prompt
    const inputText = prompt.includes("Summary:") ? 
      prompt.split("Summary:")[1] : 
      prompt.split("\n\n")[1] || prompt;
    
    // Parse requestedSentenceCount if specified
    const requestedSentenceCount = options.sentenceCount || 3;
    
    // Extract original sentences
    const sentences = inputText.match(/[^.!?]+[.!?]+/g) || [];
    if (sentences.length === 0) return inputText;
    
    // Analyze text to get key elements for more adaptive summary generation
    const analysisResult = analyzeTextForSummarization(inputText, sentences);
    
    // Generate summary using adaptive approach based on content type
    const contentType = options.contentType || detectContentType(inputText);
    
    if (prompt.includes("key themes") || prompt.includes("incorporating these key themes")) {
      // Get themes from prompt for theme-focused summary
      const themesMatch = prompt.match(/themes:\s*([^.\n]+)/);
      const themes = themesMatch ? 
        themesMatch[1].split(',').map(t => t.trim()) : 
        analysisResult.keyTopics;
      
      return generateAdaptiveSummary(sentences, analysisResult, themes, requestedSentenceCount);
    }
    else if (contentType === "biographical") {
      return generateAdaptiveBiography(sentences, analysisResult);
    }
    else {
      return generateAdaptiveSummary(sentences, analysisResult, [], requestedSentenceCount);
    }
  }
  
  /**
   * Perform deeper text analysis to guide summary generation
   */
  function analyzeTextForSummarization(text, sentences) {
    // Extract topics dynamically from the text
    const topics = extractTopics(text);
    
    // Find main entities and concepts
    const entities = extractEntities(text);
    
    // Identify key sentences for information preservation
    const keyPositions = identifyStructurallyImportantSentences(sentences);
    
    // Determine primary action verbs
    const actionVerbs = extractActionVerbs(text);
    
    // Find relationship words that can be used to connect ideas
    const relationshipTerms = findRelationshipTerms(text);
    
    return {
      keyTopics: topics.slice(0, 3),
      supportingTopics: topics.slice(3),
      mainEntities: entities.slice(0, 3),
      keyPositions,
      actionVerbs: actionVerbs.slice(0, 5),
      relationshipTerms,
      mainSentiment: detectSentiment(text),
      isDescriptive: isDescriptiveText(text),
      isPersuasive: isPersuasiveText(text),
      complexity: assessTextComplexity(text)
    };
  }
  
  /**
   * Extract main topics from text based on frequency and position
   */
  function extractTopics(text) {
    const topics = [];
    const lowerText = text.toLowerCase();
    
    // Look for noun phrases using regex patterns (simplified)
    const nounPhrasePattern = /\b(?:[a-z]+ ){0,2}(?:information|technology|communication|data|process|system|method|approach|research|content|concept|principle|theory|model|framework|analysis|development|management|strategy|solution|world|exchange|media|platforms|tools|algorithms|language|processing|summarization)\b/g;
    
    // Find all matches with their positions
    const matches = [];
    let match;
    while ((match = nounPhrasePattern.exec(lowerText)) !== null) {
      if (match[0].length > 5) {
        matches.push({
          text: match[0].trim(),
          position: match.index
        });
      }
    }
    
    // Get unique topics
    const uniqueTopics = Array.from(new Set(matches.map(m => m.text)));
    
    // Score topics by frequency and position (earlier is better)
    const scoredTopics = uniqueTopics.map(topic => {
      const occurrences = matches.filter(m => m.text === topic);
      const frequency = occurrences.length;
      
      // Average position in text (normalized to 0-1 range)
      const avgPosition = occurrences.reduce((sum, m) => sum + m.position, 0) / 
                          (occurrences.length * lowerText.length);
      
      // Favor topics mentioned early and frequently
      const score = frequency * (1 - avgPosition*0.5);
      
      return { topic, score };
    });
    
    // Return topics sorted by score
    return scoredTopics
      .sort((a, b) => b.score - a.score)
      .map(item => item.topic);
  }
  
  /**
   * Extract entities like proper nouns, organizations, etc.
   */
  function extractEntities(text) {
    const entities = [];
    
    // Look for capitalized phrases (likely proper nouns)
    const properNounPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
    
    let match;
    while ((match = properNounPattern.exec(text)) !== null) {
      if (match[0].length > 2 && !match[0].match(/^(The|A|An|This|That|These|Those|It|They|We|I|You|He|She)$/)) {
        entities.push(match[0]);
      }
    }
    
    // Count frequencies
    const entityCounts = {};
    entities.forEach(entity => {
      entityCounts[entity] = (entityCounts[entity] || 0) + 1;
    });
    
    // Return entities sorted by frequency
    return Object.entries(entityCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([entity]) => entity);
  }
  
  /**
   * Identify sentences that are structurally important (intro, conclusion, topic sentences)
   */
  function identifyStructurallyImportantSentences(sentences) {
    const important = [];
    
    if (sentences.length === 0) return important;
    
    // First sentence is often important
    if (sentences.length > 0) {
      important.push(0);
    }
    
    // Last sentence is often a conclusion
    if (sentences.length > 1) {
      important.push(sentences.length - 1);
    }
    
    // Look for sentences that introduce new topics
    sentences.forEach((sentence, idx) => {
      if (idx > 0 && idx < sentences.length - 1) {
        const lowerSentence = sentence.toLowerCase();
        
        // Topic sentence indicators
        if (
          lowerSentence.match(/\b(first|second|third|finally|moreover|furthermore|in addition|another|importantly)\b/i) ||
          lowerSentence.match(/\b(however|nevertheless|conversely|in contrast|on the other hand)\b/i)
        ) {
          important.push(idx);
        }
      }
    });
    
    return important;
  }
  
  /**
   * Extract action verbs that represent main actions in the text
   */
  function extractActionVerbs(text) {
    const commonVerbs = [
      'discuss', 'explore', 'analyze', 'present', 'describe',
      'explain', 'demonstrate', 'show', 'highlight', 'emphasize',
      'suggest', 'reveal', 'indicate', 'provide', 'address',
      'examine', 'investigate', 'develop', 'create', 'enhance'
    ];
    
    const verbsFound = [];
    
    commonVerbs.forEach(verb => {
      const verbForms = [verb, verb+'s', verb+'ed', verb+'ing'];
      
      verbForms.forEach(form => {
        if (text.toLowerCase().includes(` ${form} `)) {
          verbsFound.push(verb);
        }
      });
    });
    
    return [...new Set(verbsFound)];
  }
  
  /**
   * Find terms that express relationships between ideas
   */
  function findRelationshipTerms(text) {
    const relationships = [
      { type: 'causal', terms: ['because', 'therefore', 'thus', 'as a result', 'consequently', 'due to', 'leads to'] },
      { type: 'contrast', terms: ['however', 'although', 'despite', 'while', 'whereas', 'nevertheless', 'in contrast'] },
      { type: 'addition', terms: ['furthermore', 'moreover', 'additionally', 'in addition', 'also', 'besides'] },
      { type: 'example', terms: ['for example', 'for instance', 'such as', 'specifically', 'particularly'] },
      { type: 'emphasis', terms: ['importantly', 'significantly', 'notably', 'crucially', 'essentially'] }
    ];
    
    const found = {};
    
    relationships.forEach(({ type, terms }) => {
      terms.forEach(term => {
        if (text.toLowerCase().includes(term)) {
          found[type] = found[type] || [];
          found[type].push(term);
        }
      });
    });
    
    return found;
  }
  
  /**
   * Simple sentiment detection (positive, negative, neutral)
   */
  function detectSentiment(text) {
    const positiveWords = ['good', 'great', 'excellent', 'positive', 'valuable', 'beneficial', 'advantage', 'improvement', 'enhance', 'solution'];
    const negativeWords = ['bad', 'problem', 'challenge', 'difficult', 'issue', 'concern', 'negative', 'risk', 'threat', 'disadvantage'];
    
    const lowerText = text.toLowerCase();
    
    let positiveScore = 0;
    let negativeScore = 0;
    
    positiveWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\w*\\b`, 'g');
      const matches = lowerText.match(regex);
      if (matches) positiveScore += matches.length;
    });
    
    negativeWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\w*\\b`, 'g');
      const matches = lowerText.match(regex);
      if (matches) negativeScore += matches.length;
    });
    
    if (positiveScore > negativeScore * 1.5) return 'positive';
    if (negativeScore > positiveScore * 1.5) return 'negative';
    return 'neutral';
  }
  
  /**
   * Check if text is primarily descriptive
   */
  function isDescriptiveText(text) {
    const descriptiveIndicators = [
      'is', 'are', 'was', 'were', 'appears', 'seems',
      'looks', 'contains', 'includes', 'consists'
    ];
    
    let descriptiveScore = 0;
    const lowerText = text.toLowerCase();
    
    descriptiveIndicators.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      const matches = lowerText.match(regex);
      if (matches) descriptiveScore += matches.length;
    });
    
    return descriptiveScore > text.split(/\s+/).length / 25;
  }
  
  /**
   * Check if text is persuasive/argumentative
   */
  function isPersuasiveText(text) {
    const persuasiveIndicators = [
      'should', 'must', 'need to', 'important', 'essential', 'critical',
      'argue', 'argument', 'claim', 'support', 'evidence', 'prove'
    ];
    
    let persuasiveScore = 0;
    const lowerText = text.toLowerCase();
    
    persuasiveIndicators.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      const matches = lowerText.match(regex);
      if (matches) persuasiveScore += matches.length;
    });
    
    return persuasiveScore > text.split(/\s+/).length / 30;
  }
  
  /**
   * Assess text complexity based on sentence length and word length
   */
  function assessTextComplexity(text) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    if (sentences.length === 0) return 'medium';
    
    const words = text.match(/\b[\w']+\b/g) || [];
    if (words.length === 0) return 'medium';
    
    const avgWordsPerSentence = words.length / sentences.length;
    const avgWordLength = words.join('').length / words.length;
    
    const complexityScore = (avgWordsPerSentence / 10) + (avgWordLength / 4);
    
    if (complexityScore > 3) return 'high';
    if (complexityScore < 2) return 'low';
    return 'medium';
  }
  
  /**
   * Generate a completely adaptive summary based on content analysis
   */
  function generateAdaptiveSummary(sentences, analysis, themes, sentenceCount) {
    // Track used phrases to avoid repetition
    const usedPhrases = new Set();
    const usedIntroPatterns = new Set();
    
    // Segment the input text into meaningful sections rather than just sentences
    const sections = segmentIntoSections(sentences);
    
    // Get main topics either from provided themes or from analysis
    const topics = themes.length > 0 ? themes : analysis.keyTopics;
    const entities = analysis.mainEntities;
    
    // INTRO: Build intro sentence using more varied patterns and creativity
    let introSentence = "";
    const introPatterns = [
      topic => `The text examines the importance of ${topic} in modern contexts.`,
      (topic, secondTopic) => `${capitalizeFirstLetter(topic)} is a central focus in this discussion of ${secondTopic}.`,
      topic => `This content addresses key aspects of ${topic} and its implications.`,
      (topic, verb) => `The author ${verb}s how ${topic} impacts various domains.`,
      topic => `An analysis of ${topic} reveals several important insights.`
    ];
    
    // Select intro pattern ensuring we don't use the "This text analyzes" pattern repeatedly
    const chooseIntroPattern = () => {
      let pattern;
      let attempts = 0;
      do {
        pattern = introPatterns[Math.floor(Math.random() * introPatterns.length)];
        attempts++;
      } while (usedIntroPatterns.has(pattern.toString()) && attempts < 10);
      
      usedIntroPatterns.add(pattern.toString());
      return pattern;
    };
    
    if (topics.length > 0) {
      const mainTopic = topics[0];
      const secondaryTopic = topics.length > 1 ? topics[1] : null;
      const verb = analysis.actionVerbs.length > 0 ? analysis.actionVerbs[0] : "discuss";
      
      const introPattern = chooseIntroPattern();
      
      if (secondaryTopic && introPattern.length >= 2) {
        introSentence = introPattern(mainTopic, secondaryTopic);
      } else if (introPattern.length >= 2) {
        introSentence = introPattern(mainTopic, verb);
      } else {
        introSentence = introPattern(mainTopic);
      }
      
      usedPhrases.add(mainTopic);
      if (secondaryTopic) usedPhrases.add(secondaryTopic);
    } else {
      introSentence = "The document explores several interconnected concepts and their implications.";
    }
    
    // Extract key insights from different sections of the text to ensure variety
    const keyInsights = extractDistinctInsights(sections, topics, usedPhrases);
    
    // BODY: Select insights from different sections of the text
    const bodyCount = Math.max(1, sentenceCount - 2); // Adjust based on required sentence count
    const bodyInsights = keyInsights.slice(0, bodyCount);
    
    // Create body sentences with varied structures
    const bodySentences = bodyInsights.map(insight => {
      // Create a sentence that doesn't repeat already used phrases
      return generateNonRepetitiveSentence(insight, topics, usedPhrases);
    });
    
    // CONCLUSION: Create a conclusion that brings everything together
    let conclusionSentence = "";
    
    // Extract an actual concluding sentence if available
    const concludingSentences = sentences.slice(-2);
    const hasActualConclusion = concludingSentences.some(s => 
      s.match(/(?:in conclusion|to summarize|overall|ultimately|therefore|thus)/i)
    );
    
    if (hasActualConclusion) {
      // Use the actual conclusion from the text
      const actualConclusion = concludingSentences.find(s => 
        s.match(/(?:in conclusion|to summarize|overall|ultimately|therefore|thus)/i)
      );
      conclusionSentence = rewriteAdaptively(actualConclusion, analysis, topics, usedPhrases);
    } else {
      // Create a synthetic conclusion
      const unusedTopics = topics.filter(t => !usedPhrases.has(t));
      const concludingTopic = unusedTopics.length > 0 ? unusedTopics[0] : topics[0];
      
      const conclusionPatterns = [
        topic => `These developments highlight the ongoing importance of ${topic} in this field.`,
        topic => `The implications of ${topic} extend across multiple domains and applications.`,
        topic => `Understanding ${topic} provides valuable insights for future developments in this area.`,
      ];
      
      const conclusionPattern = conclusionPatterns[Math.floor(Math.random() * conclusionPatterns.length)];
      conclusionSentence = conclusionPattern(concludingTopic);
    }
    
    // Combine all parts
    const rawSummary = introSentence + ' ' + bodySentences.join(' ') + ' ' + conclusionSentence;
    
    // Final quality control check
    return improveTextQuality(rawSummary);
  }
  
  /**
   * Segment text into meaningful sections rather than just sentences
   */
  function segmentIntoSections(sentences) {
    if (sentences.length <= 3) return [sentences];
    
    const sections = [];
    let currentSection = [];
    
    sentences.forEach((sentence, index) => {
      // Add to current section
      currentSection.push(sentence);
      
      // Check if this might be a section boundary
      const lowerSentence = sentence.toLowerCase();
      const nextSentence = index < sentences.length - 1 ? sentences[index + 1].toLowerCase() : "";
      
      const isSectionBoundary = 
        // Current sentence ends a thought
        sentence.endsWith('.') &&
        // Next sentence starts a new thought or topic
        (nextSentence.match(/^(moreover|furthermore|however|in addition|another|also|first|second|finally|lastly|importantly)/i) ||
         // Current sentence seems to conclude a point
         lowerSentence.match(/(?:therefore|thus|in conclusion|to summarize|consequently|as a result)/) ||
         // We've accumulated several sentences in this section
         currentSection.length >= 3);
      
      if (isSectionBoundary && currentSection.length > 0) {
        sections.push([...currentSection]);
        currentSection = [];
      }
    });
    
    // Add any remaining sentences to the last section
    if (currentSection.length > 0) {
      sections.push(currentSection);
    }
    
    return sections;
  }
  
  /**
   * Extract distinct insights from different sections of text
   * avoiding repetition of the same ideas
   */
  function extractDistinctInsights(sections, topics, usedPhrases) {
    const insights = [];
    
    // Go through each section to extract a key insight
    sections.forEach(section => {
      if (section.length === 0) return;
      
      // Analyze each sentence in the section
      const sectionInsights = section.map(sentence => {
        // Skip sentences that mostly repeat already used phrases
        if (containsAnyPhrase(sentence, Array.from(usedPhrases))) {
          return { sentence, uniqueness: 0 };
        }
        
        // Calculate how many unique topics this sentence covers
        const uniqueTopicsMentioned = topics.filter(topic => 
          sentence.toLowerCase().includes(topic.toLowerCase()) && 
          !usedPhrases.has(topic)
        );
        
        // Prefer sentences with themes not yet covered
        return { 
          sentence, 
          uniqueness: uniqueTopicsMentioned.length,
          topics: uniqueTopicsMentioned
        };
      });
      
      // Get the most insightful sentence from this section
      const bestInsight = sectionInsights.sort((a, b) => b.uniqueness - a.uniqueness)[0];
      
      if (bestInsight && bestInsight.uniqueness > 0) {
        insights.push(bestInsight);
        
        // Mark these topics as used
        bestInsight.topics.forEach(topic => usedPhrases.add(topic));
      } else if (section.length > 0) {
        // If no uniquely insightful sentence, just use the first one from this section
        insights.push({ sentence: section[0], uniqueness: 0, topics: [] });
      }
    });
    
    return insights.map(insight => insight.sentence);
  }
  
  /**
   * Generate a sentence that doesn't repeat already used content
   */
  function generateNonRepetitiveSentence(baseSentence, topics, usedPhrases) {
    // If sentence repeats many used phrases, do more aggressive rewriting
    if (containsAnyPhrase(baseSentence, Array.from(usedPhrases), 2)) {
      // Find topics not yet covered
      const unusedTopics = topics.filter(t => !usedPhrases.has(t));
      
      if (unusedTopics.length > 0) {
        // Create a sentence focusing on an unused topic
        const topic = unusedTopics[0];
        usedPhrases.add(topic);
        
        const patterns = [
          t => `${capitalizeFirstLetter(t)} facilitates more effective information processing.`,
          t => `The concept of ${t} addresses key challenges in this context.`,
          t => `Advancements in ${t} continue to shape this field.`
        ];
        
        return patterns[Math.floor(Math.random() * patterns.length)](topic);
      }
    }
    
    // For less repetitive content, just clean up and rephrase slightly
    return rewriteAdaptively(baseSentence, {}, topics, usedPhrases);
  }
  
  /**
   * Check if text contains any of the specified phrases
   */
  function containsAnyPhrase(text, phrases, threshold = 1) {
    const lowerText = text.toLowerCase();
    let matches = 0;
    
    for (const phrase of phrases) {
      if (phrase && phrase.length > 3 && lowerText.includes(phrase.toLowerCase())) {
        matches++;
        if (matches >= threshold) return true;
      }
    }
    
    return false;
  }
  
  /**
   * Adaptively rewrite a sentence to avoid repetition and improve quality
   */
  function rewriteAdaptively(sentence, analysis = {}, topics = [], usedPhrases = new Set()) {
    let result = sentence;
    
    // Remove filler phrases
    const fillerPhrases = [
      'it is important to note that', 'it should be noted that', 'it is worth noting that',
      'in other words', 'as you can see', 'as a matter of fact'
    ];
    
    fillerPhrases.forEach(phrase => {
      result = result.replace(new RegExp(phrase, 'gi'), '');
    });
    
    // Avoid starting sentences with "This text" repeatedly
    if (result.match(/^(This text|The text)\s+(?:analyze|analyzes|discuss|discusses|describe|describes)/i)) {
      // Replace with a more varied sentence starter
      const starters = [
        "The content highlights how",
        "The document explains that",
        "The analysis shows that",
        "The discussion reveals that"
      ];
      result = result.replace(/^(This text|The text)\s+(?:analyze|analyzes|discuss|discusses|describe|describes)/i, 
        starters[Math.floor(Math.random() * starters.length)]);
    }
    
    // Fix grammar issues ("analyze" → "analyzes")
    result = result.replace(/\b(text|content|document|analysis)\s+analyze\b/i, '$1 analyzes');
    
    // Fix spacing and punctuation
    result = result.replace(/\s+/g, ' ').trim();
    result = result.replace(/\s+([,.;:])/g, '$1');
    
    // Ensure proper capitalization
    if (result.length > 0) {
      result = result.charAt(0).toUpperCase() + result.slice(1);
    }
    
    // Ensure the sentence ends with proper punctuation
    if (!result.match(/[.!?]$/)) {
      result += '.';
    }
    
    return result;
  }
  
  /**
   * Final quality improvement pass to catch any remaining issues
   */
  function improveTextQuality(text) {
    // Split into sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    if (sentences.length <= 1) return text;
    
    // Check for near-duplicate sentences and rewrite them
    const uniqueSentences = [];
    const seenSentenceKeys = new Set();
    
    sentences.forEach(sentence => {
      // Create a simplified key for similarity checking
      const key = sentence
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3) // Only compare significant words
        .slice(0, 5) // Just use the first few words
        .join(' ');
      
      // If we've seen a very similar sentence, create a variation
      if (key.length > 10 && seenSentenceKeys.has(key)) {
        // Sentence is too similar to one we've already included
        // Try a different sentence structure
        if (sentence.match(/^This|The/)) {
          // Change from "This/The X" to an active phrasing
          const simpleSentence = sentence
            .replace(/^(This|The)\s+[^.!?]+?(is|are|has|have|can|will|may)/i, 'It $2')
            .replace(/^(This|The)\s+[^.!?]+?(analyze|discusses|describes|shows|presents|highlights)/i, 'We see that it $2');
          
          uniqueSentences.push(simpleSentence);
        } else {
          // Just keep one instance of this sentence pattern
          // Don't add it again
        }
      } else if (key.length > 0) {
        // It's a unique enough sentence
        seenSentenceKeys.add(key);
        uniqueSentences.push(sentence);
      }
    });
    
    // Add transition words for better flow
    const result = [];
    uniqueSentences.forEach((sentence, i) => {
      if (i === 0) {
        result.push(sentence);
      } else {
        // Add varied transitions that fit the content relationship
        const transitions = [
          'Additionally,', 'Furthermore,', 'Moreover,', 
          'In this context,', 'Beyond this,', 'Building on this idea,'
        ];
        
        // Simple heuristic to avoid too many of the same transition
        const transition = transitions[i % transitions.length];
        
        // Add transition word/phrase
        const sentenceStart = sentence.charAt(0).toLowerCase() + sentence.slice(1);
        result.push(`${transition} ${sentenceStart}`);
      }
    });
    
    return result.join(' ');
  }
  
  /**
   * Simple helper to capitalize the first letter of a string
   */
  function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  
  return {
    /**
     * Generate a summary using appropriate prompt based on content type
     */
    async generateSummary(text, options = {}) {
      // Detect content type to choose appropriate prompt
      const contentType = options.contentType || detectContentType(text);
      
      // Select appropriate prompt template
      let promptTemplate;
      switch (contentType) {
        case "biographical":
          promptTemplate = PROMPT_TEMPLATES.summarize.biographical;
          break;
        case "academic":
          promptTemplate = PROMPT_TEMPLATES.summarize.formal;
          break;
        case "technical":
          promptTemplate = PROMPT_TEMPLATES.summarize.explanatory;
          break;
        default:
          promptTemplate = PROMPT_TEMPLATES.summarize.basic;
      }
      
      // Generate prompt and process with LLM
      const prompt = promptTemplate(text);
      const summary = await processWithLLM(prompt, options);
      return summary;
    },
    
    /**
     * Enhance a summary using the provided key elements
     */
    async enhanceSummary(summary, keyElements, options = {}) {
      // Choose enhancement approach based on available elements
      let promptTemplate;
      let elements;
      
      if (keyElements.themes && keyElements.themes.length > 0) {
        promptTemplate = PROMPT_TEMPLATES.enhance.withThemes;
        elements = keyElements.themes.slice(0, 5).map(t => typeof t === 'string' ? t : t.text);
      }
      else if (keyElements.entities && keyElements.entities.length > 0) {
        promptTemplate = PROMPT_TEMPLATES.enhance.withEntities;
        elements = keyElements.entities.slice(0, 5).map(e => typeof e === 'string' ? e : e.text);
      }
      else {
        // If no specific elements, choose based on content type
        if (options.contentType === "academic") {
          promptTemplate = PROMPT_TEMPLATES.enhance.academic;
          return await processWithLLM(promptTemplate(summary), options);
        } else {
          promptTemplate = PROMPT_TEMPLATES.enhance.simplified;
          return await processWithLLM(promptTemplate(summary), options);
        }
      }
      
      // Generate prompt with elements and process
      const prompt = promptTemplate(summary, elements);
      return await processWithLLM(prompt, options);
    },
    
    /**
     * Analyze content to identify its type and structure
     */
    analyzeContent(text) {
      const contentType = detectContentType(text);
      return {
        contentType,
        estimatedReadingTime: Math.ceil(text.split(/\s+/).length / 200), // words per minute
        complexity: contentType === "technical" || contentType === "academic" ? "high" : "moderate"
      };
    }
  };
})();
