/**
 * LLM Handler - Manages interactions with language models for advanced text processing
 */
const LLMHandler = (() => {
    // Prompt templates for different summarization/enhancement approaches.
    const PROMPT_TEMPLATES = {
      summarize: {
        basic: text => `Summarize the following text concisely:\n\n${text}`,
        formal: text => `Create a formal summary of the following text:\n\n${text}`,
        explanatory: text => `Explain the key points from this text:\n\n${text}`,
        creative: text => `Rewrite this content in a creative, engaging way while preserving the key information:\n\n${text}`,
        biographical: text => `Create a biographical summary focusing on the main person mentioned:\n\n${text}`,
      },
      enhance: {
        withThemes: (text, themes) =>
          `Rewrite the following summary, incorporating these key themes: ${themes.join(
            ", "
          )}.\n\nSummary: ${text}`,
        withEntities: (text, entities) =>
          `Enhance this summary by highlighting the role of these entities: ${entities.join(
            ", "
          )}.\n\nSummary: ${text}`,
        academic: text => `Rewrite this summary in a more academic style:\n\n${text}`,
        simplified: text => `Simplify this summary to make it more accessible:\n\n${text}`,
      },
    };
  
    /* ---------------- Helpers ---------------- */
  
    // Remove filler phrases using a given list.
    const removeFillerPhrases = (text, phrases) =>
      phrases.reduce(
        (acc, phrase) => acc.replace(new RegExp(phrase, "gi"), ""),
        text
      );
  
    // Basic cleanup: spacing, punctuation, and capitalization.
    function cleanText(text) {
      let result = text.replace(/\s+/g, " ").trim();
      result = result.replace(/\s+([,.;:])/g, "$1");
      if (!result.match(/[.!?]$/)) result += ".";
      return result.charAt(0).toUpperCase() + result.slice(1);
    }
  
    // Capitalize first letter.
    const capitalizeFirstLetter = string =>
      string ? string.charAt(0).toUpperCase() + string.slice(1) : "";
  
    /* ---------------- Core Analysis Functions ---------------- */
  
    function analyzeTextForSummarization(text, sentences) {
      const topics = extractTopics(text);
      const entities = extractEntities(text);
      const keyPositions = identifyStructurallyImportantSentences(sentences);
      const actionVerbs = extractActionVerbs(text);
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
        complexity: assessTextComplexity(text),
      };
    }
  
    function extractTopics(text) {
      const lowerText = text.toLowerCase();
      const entities = extractEntities(text);
      const entitySet = new Set(entities.map(e => e.toLowerCase()));
  
      const nounPhrasePattern = /\b(?:[a-z]+ ){0,2}(?:information|technology|communication|data|process|system|method|approach|research|content|concept|principle|theory|model|framework|analysis|development|management|strategy|solution|world|exchange|media|platforms|tools|algorithms|language|processing|summarization)\b/g;
      let matches = [];
      let match;
      while ((match = nounPhrasePattern.exec(lowerText)) !== null) {
        const phrase = match[0].trim();
        if (phrase.length > 5 && ![...entitySet].some(e => e.includes(phrase))) {
          matches.push({ text: phrase, position: match.index });
        }
      }
      const uniqueTopics = Array.from(new Set(matches.map(m => m.text)));
      const scoredTopics = uniqueTopics.map(topic => {
        const occurrences = matches.filter(m => m.text === topic);
        const frequency = occurrences.length;
        const avgPosition =
          occurrences.reduce((sum, m) => sum + m.position, 0) /
          (occurrences.length * lowerText.length);
        return { topic, score: frequency * (1 - avgPosition * 0.5) };
      });
      return scoredTopics
        .sort((a, b) => b.score - a.score)
        .map(item => item.topic);
    }
  
    function extractEntities(text) {
      const entities = [];
      const fullNamePattern = /\b([A-Z][a-zÀ-ÿ]+(?:\s+(?:[A-Z][a-zÀ-ÿ]+|d[aeo]\s+[A-Z][a-zÀ-ÿ]+|d[aeo]|van|von|del|la|el|bin|ibn|al))+)\b/g;
      let match;
      while ((match = fullNamePattern.exec(text)) !== null) {
        if (match[1].length > 2) entities.push(match[1]);
      }
      const properNounPattern = /\b[A-Z][a-zÀ-ÿ]+(?:\s+[A-Z][a-zÀ-ÿ]+)*\b/g;
      while ((match = properNounPattern.exec(text)) !== null) {
        if (
          match[0].length > 2 &&
          !match[0].match(/^(The|A|An|This|That|These|Those|It|They|We|I|You|He|She)$/)
        ) {
          entities.push(match[0]);
        }
      }
      // Name fragments handling (optional extra processing) can be added here.
      // For brevity, we simply return the entities sorted by frequency.
      const entityCounts = {};
      entities.forEach(entity => {
        const count =
          (text.match(new RegExp(`\\b${entity.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "g")) || []).length;
        entityCounts[entity] = (entityCounts[entity] || 0) + count;
      });
      return Object.entries(entityCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([entity]) => entity);
    }
  
    function identifyStructurallyImportantSentences(sentences) {
      const important = [];
      if (!sentences.length) return important;
      important.push(0); // First sentence
      if (sentences.length > 1) important.push(sentences.length - 1); // Last sentence
      sentences.forEach((sentence, idx) => {
        if (idx > 0 && idx < sentences.length - 1) {
          const lowerSentence = sentence.toLowerCase();
          if (
            lowerSentence.match(
              /\b(first|second|third|finally|moreover|furthermore|in addition|another|importantly)\b/i
            ) ||
            lowerSentence.match(/\b(however|nevertheless|conversely|in contrast|on the other hand)\b/i)
          ) {
            important.push(idx);
          }
        }
      });
      return important;
    }
  
    function extractActionVerbs(text) {
      const commonVerbs = [
        "discuss",
        "explore",
        "analyze",
        "present",
        "describe",
        "explain",
        "demonstrate",
        "show",
        "highlight",
        "emphasize",
        "suggest",
        "reveal",
        "indicate",
        "provide",
        "address",
        "examine",
        "investigate",
        "develop",
        "create",
        "enhance",
      ];
      const verbsFound = [];
      commonVerbs.forEach(verb => {
        const forms = [verb, verb + "s", verb + "ed", verb + "ing"];
        forms.forEach(form => {
          if (text.toLowerCase().includes(` ${form} `)) {
            verbsFound.push(verb);
          }
        });
      });
      return [...new Set(verbsFound)];
    }
  
    function findRelationshipTerms(text) {
      const relationships = [
        { type: "causal", terms: ["because", "therefore", "thus", "as a result", "consequently", "due to", "leads to"] },
        { type: "contrast", terms: ["however", "although", "despite", "while", "whereas", "nevertheless", "in contrast"] },
        { type: "addition", terms: ["furthermore", "moreover", "additionally", "in addition", "also", "besides"] },
        { type: "example", terms: ["for example", "for instance", "such as", "specifically", "particularly"] },
        { type: "emphasis", terms: ["importantly", "significantly", "notably", "crucially", "essentially"] },
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
  
    function detectSentiment(text) {
      const positiveWords = [
        "good",
        "great",
        "excellent",
        "positive",
        "valuable",
        "beneficial",
        "advantage",
        "improvement",
        "enhance",
        "solution",
      ];
      const negativeWords = [
        "bad",
        "problem",
        "challenge",
        "difficult",
        "issue",
        "concern",
        "negative",
        "risk",
        "threat",
        "disadvantage",
      ];
      const lowerText = text.toLowerCase();
      let positiveScore = 0,
        negativeScore = 0;
      positiveWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\w*\\b`, "g");
        const matches = lowerText.match(regex);
        if (matches) positiveScore += matches.length;
      });
      negativeWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\w*\\b`, "g");
        const matches = lowerText.match(regex);
        if (matches) negativeScore += matches.length;
      });
      if (positiveScore > negativeScore * 1.5) return "positive";
      if (negativeScore > positiveScore * 1.5) return "negative";
      return "neutral";
    }
  
    function isDescriptiveText(text) {
      const indicators = ["is", "are", "was", "were", "appears", "seems", "looks", "contains", "includes", "consists"];
      let score = 0;
      const lowerText = text.toLowerCase();
      indicators.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, "g");
        const matches = lowerText.match(regex);
        if (matches) score += matches.length;
      });
      return score > text.split(/\s+/).length / 25;
    }
  
    function isPersuasiveText(text) {
      const indicators = [
        "should",
        "must",
        "need to",
        "important",
        "essential",
        "critical",
        "argue",
        "argument",
        "claim",
        "support",
        "evidence",
        "prove",
      ];
      let score = 0;
      const lowerText = text.toLowerCase();
      indicators.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, "g");
        const matches = lowerText.match(regex);
        if (matches) score += matches.length;
      });
      return score > text.split(/\s+/).length / 30;
    }
  
    function assessTextComplexity(text) {
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
      if (!sentences.length) return "medium";
      const words = text.match(/\b[\w']+\b/g) || [];
      if (!words.length) return "medium";
      const avgWordsPerSentence = words.length / sentences.length;
      const avgWordLength = words.join("").length / words.length;
      const complexityScore = avgWordsPerSentence / 10 + avgWordLength / 4;
      if (complexityScore > 3) return "high";
      if (complexityScore < 2) return "low";
      return "medium";
    }
  
    function assessTextConfidence(text, analysis = {}) {
      let confidence = 0.5; // Base confidence.
      if (text.match(/^[A-Z].+[.!?]$/)) confidence += 0.1;
      const words = text.split(/\s+/);
      if (words.length > 30) confidence -= 0.1;
      if (words.length < 8) confidence -= 0.05;
      const preciseTerms = ["specifically", "precisely", "exactly", "clearly", "demonstrates", "proves"];
      for (const term of preciseTerms) {
        if (text.toLowerCase().includes(term)) {
          confidence += 0.05;
          break;
        }
      }
      const vagueTerms = ["sort of", "kind of", "maybe", "perhaps", "might", "could be", "somewhat"];
      for (const term of vagueTerms) {
        if (text.toLowerCase().includes(term)) {
          confidence -= 0.05;
          break;
        }
      }
      if (analysis.keyTopics && analysis.keyTopics.length > 0) {
        const count = analysis.keyTopics.reduce(
          (cnt, topic) =>
            text.toLowerCase().includes(topic.toLowerCase()) ? cnt + 1 : cnt,
          0
        );
        confidence += 0.05 * Math.min(3, count);
      }
      if (analysis.mainEntities && analysis.mainEntities.length > 0) {
        const count = analysis.mainEntities.reduce(
          (cnt, entity) => (text.includes(entity) ? cnt + 1 : cnt),
          0
        );
        if (count > 0) confidence += 0.1;
      }
      if (analysis.keyPositions && analysis.keyPositions.length > 0) {
        if (analysis.keyPositions.includes(0) || analysis.keyPositions.includes(analysis.keyPositions.length - 1)) {
          confidence += 0.1;
        }
      }
      if (/\b(therefore|thus|consequently|as a result|however|moreover|furthermore|in conclusion|to summarize|finally)\b/i.test(text)) {
        confidence += 0.05;
      }
      return Math.max(0.1, Math.min(0.9, confidence));
    }
  
    // Extract 4+ word phrases to help preserve key parts of original text.
    function extractKeyPhrases(text) {
      const phrases = [];
      const words = text.split(/\s+/);
      if (words.length < 4) return phrases;
      for (let i = 0; i <= words.length - 4; i++) {
        for (let len = 4; len <= Math.min(7, words.length - i); len++) {
          const phrase = words.slice(i, i + len).join(" ");
          if (
            !phrase.match(/^(this|that|these|those|it|there|here|when|while)\s/i) &&
            phrase.match(/\b\w{5,}\b/) &&
            phrase.split(/\s+/).filter(w => w.length < 4).length < phrase.split(/\s+/).length / 2
          ) {
            phrases.push(phrase);
          }
        }
      }
      return phrases;
    }
  
    // Extract main verb from a sentence using common verbs.
    function extractMainVerb(text) {
      const commonVerbs = [
        "discuss",
        "explore",
        "analyze",
        "present",
        "describe",
        "explain",
        "demonstrate",
        "show",
        "highlight",
        "emphasize",
        "suggest",
        "reveal",
        "indicate",
        "provide",
        "address",
      ];
      for (const verb of commonVerbs) {
        const forms = [verb, `${verb}s`, `${verb}ed`, `${verb}ing`];
        for (const form of forms) {
          if (text.toLowerCase().match(new RegExp(`\\b${form}\\b`))) {
            return verb;
          }
        }
      }
      return null;
    }
  
    /* ---------------- Adaptive Rewriting ---------------- */
  
    /**
     * Adaptively rewrite a sentence based on analysis confidence.
     * It preserves key entities (using placeholders), removes filler phrases,
     * and—if needed—injects unused topics to avoid repetition.
     */
    function rewriteAdaptively(sentence, analysis = {}, topics = [], usedPhrases = new Set()) {
      const confidence = assessTextConfidence(sentence, analysis);
      const originalSentence = sentence;
      let result = sentence;
  
      // Protect entities by replacing them with placeholders.
      const preservedEntities = (analysis.mainEntities || []);
      const entityPlaceholders = {};
      let counter = 0;
      preservedEntities
        .sort((a, b) => b.length - a.length)
        .forEach(entity => {
          const placeholder = `__ENTITY_${counter++}__`;
          entityPlaceholders[placeholder] = entity;
          const regex = new RegExp(`\\b${entity.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&`)}\\b`, "g");
          result = result.replace(regex, placeholder);
        });
  
      // Define filler phrases.
      const highConfidenceFillers = ["in other words"];
      const mediumLowFillers = [
        "it is important to note that",
        "it should be noted that",
        "it is worth noting that",
        "in other words",
        "as you can see",
        "as a matter of fact",
        "it can be said that",
        "needless to say",
        "as mentioned earlier",
      ];
  
      if (confidence > 0.7) {
        result = removeFillerPhrases(result, highConfidenceFillers);
      } else if (confidence > 0.4) {
        result = removeFillerPhrases(result, mediumLowFillers);
        // Vary sentence starter if needed.
        if (result.match(/^(This text|The text)\s+(analyze|analyzes|discuss|discusses|describe|describes)/i)) {
          const starters = [
            "The content highlights how",
            "The document explains that",
            "The analysis shows that",
            "The discussion reveals that",
          ];
          result = result.replace(
            /^(This text|The text)\s+(analyze|analyzes|discuss|discusses|describe|describes)/i,
            starters[Math.floor(Math.random() * starters.length)]
          );
        }
        result = result.replace(/\b(text|content|document|analysis)\s+analyze\b/i, "$1 analyzes");
      } else {
        // For low confidence, attempt an aggressive rewrite with unused topics.
        if (topics.length > 0) {
          const unusedTopics = topics.filter(t => !usedPhrases.has(t));
          if (unusedTopics.length > 0) {
            const topic = unusedTopics[0];
            const mainVerb = extractMainVerb(result);
            const mainVerbPhrase = mainVerb ? ` ${mainVerb}s ` : " discusses ";
            const newSentences = [
              `${capitalizeFirstLetter(topic)}${mainVerbPhrase}key aspects covered in the content.`,
              `The significance of ${topic} becomes apparent in this context.`,
              `When examining ${topic}, several important insights emerge.`,
              `${capitalizeFirstLetter(topic)} represents a central consideration in this analysis.`,
            ];
            result = newSentences[Math.floor(Math.random() * newSentences.length)];
            usedPhrases.add(topic);
          }
        }
        result = removeFillerPhrases(result, mediumLowFillers);
      }
  
      result = cleanText(result);
  
      // Restore entity placeholders.
      Object.entries(entityPlaceholders).forEach(([placeholder, entity]) => {
        result = result.replace(new RegExp(placeholder, "g"), entity);
      });
  
      // Optionally, for medium/high confidence, try inserting a key phrase from the original.
      if (confidence > 0.4 && originalSentence !== result) {
        const originalPhrases = extractKeyPhrases(originalSentence);
        if (originalPhrases.length > 0 && result.length > 20) {
          const phrase = originalPhrases[Math.floor(Math.random() * originalPhrases.length)];
          if (!result.includes(phrase) && phrase.length > 10) {
            const midPoint = Math.floor(result.length / 2);
            let insertPoint = result.indexOf(". ", midPoint);
            if (insertPoint === -1) insertPoint = result.indexOf(", ", midPoint);
            if (insertPoint !== -1) {
              result =
                result.substring(0, insertPoint + 2) +
                'as the original text states, "' +
                phrase +
                '"' +
                result.substring(insertPoint + 2);
            }
          }
        }
      }
      return cleanText(result);
    }
  
    /* ---------------- Adaptive Summary Generation ---------------- */
  
    // Segment sentences into sections based on boundaries without relying on transition words
    function segmentIntoSections(sentences) {
      if (sentences.length <= 3) return [sentences];
      const sections = [];
      let currentSection = [];
      sentences.forEach((sentence, index) => {
        currentSection.push(sentence);
        const lowerSentence = sentence.toLowerCase();
        // Avoid detecting transitions but still segment on other indicators
        const isBoundary =
          sentence.endsWith(".") &&
          (lowerSentence.match(/(therefore|thus|in conclusion|to summarize|consequently|as a result)/) ||
            currentSection.length >= 3);
        if (isBoundary && currentSection.length > 0) {
          sections.push([...currentSection]);
          currentSection = [];
        }
      });
      if (currentSection.length > 0) sections.push(currentSection);
      return sections;
    }
  
    // Extract distinct insights from each section while avoiding repetition.
    function extractDistinctInsights(sections, topics, usedPhrases) {
      const insights = [];
      sections.forEach(section => {
        if (!section.length) return;
        const sectionInsights = section.map(sentence => {
          if (containsAnyPhrase(sentence, Array.from(usedPhrases))) {
            return { sentence, uniqueness: 0 };
          }
          const uniqueTopics = topics.filter(
            topic => sentence.toLowerCase().includes(topic.toLowerCase()) && !usedPhrases.has(topic)
          );
          return { sentence, uniqueness: uniqueTopics.length, topics: uniqueTopics };
        });
        const bestInsight = sectionInsights.sort((a, b) => b.uniqueness - a.uniqueness)[0];
        if (bestInsight && bestInsight.uniqueness > 0) {
          insights.push(bestInsight.sentence);
          bestInsight.topics.forEach(topic => usedPhrases.add(topic));
        } else if (section.length > 0) {
          insights.push(section[0]);
        }
      });
      return insights;
    }
  
    // Check if text contains any of the specified phrases (with a threshold).
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
  
    // Generate a non-repetitive sentence focusing on an unused topic.
    function generateNonRepetitiveSentence(baseSentence, topics, usedPhrases) {
      if (containsAnyPhrase(baseSentence, Array.from(usedPhrases), 2)) {
        const unusedTopics = topics.filter(t => !usedPhrases.has(t));
        if (unusedTopics.length > 0) {
          const topic = unusedTopics[0];
          usedPhrases.add(topic);
          const patterns = [
            t => `${capitalizeFirstLetter(t)} facilitates more effective information processing.`,
            t => `The concept of ${t} addresses key challenges in this context.`,
            t => `Advancements in ${t} continue to shape this field.`,
          ];
          return patterns[Math.floor(Math.random() * patterns.length)](topic);
        }
      }
      return rewriteAdaptively(baseSentence, {}, topics, usedPhrases);
    }
  
    // Final pass to improve overall text quality and remove near-duplicate sentences.
    function improveTextQuality(text) {
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
      if (sentences.length <= 1) return text;
      const uniqueSentences = [];
      const seenKeys = new Set();
      
      // Filter out sentences that begin with transition words
      const filteredSentences = sentences.filter(sentence => 
        !sentence.match(/^(furthermore|moreover|additionally|however|thus|therefore|in addition|consequently)/i)
      );
      
      // If filtering removed all sentences, use original sentences
      const workingSentences = filteredSentences.length > 0 ? filteredSentences : sentences;
      
      workingSentences.forEach(sentence => {
        // Remove transition words from beginning of sentences
        let processedSentence = sentence.replace(/^(furthermore|moreover|additionally|however|thus|therefore|in addition|consequently)[,]?\s+/i, '');
        
        const key = processedSentence
          .toLowerCase()
          .replace(/[^a-z0-9]/g, " ")
          .split(/\s+/)
          .filter(w => w.length > 3)
          .slice(0, 5)
          .join(" ");
          
        if (key.length > 10 && seenKeys.has(key)) {
          if (processedSentence.match(/^(This|The)/)) {
            const simpleSentence = processedSentence
              .replace(/^(This|The)\s+[^.!?]+?(is|are|has|have|can|will|may)/i, "It $2")
              .replace(/^(This|The)\s+[^.!?]+?(analyze|discusses|describes|shows|presents|highlights)/i, "We see that it $2");
            uniqueSentences.push(simpleSentence);
          }
        } else if (key.length > 0) {
          seenKeys.add(key);
          uniqueSentences.push(processedSentence);
        }
      });
      
      // Join directly with spaces, not adding any transitions
      return uniqueSentences.join(" ");
    }
  
    /* ---------------- Summary & Biography Generation ---------------- */
  
    /**
     * Generate a completely adaptive summary based on content analysis
     * With dynamic sentence construction instead of templates
     */
    function generateAdaptiveSummary(sentences, analysis, themes, sentenceCount) {
      // Track used phrases to avoid repetition
      const usedPhrases = new Set();
      const preservedEntities = new Set();
      
      // Add entities to preserved set to ensure they're not fragmented
      if (analysis.mainEntities && analysis.mainEntities.length > 0) {
        analysis.mainEntities.forEach(entity => preservedEntities.add(entity));
      }
      
      // Segment the input text into meaningful sections
      const sections = segmentIntoSections(sentences);
      
      // Get main topics either from provided themes or from analysis
      const topics = themes.length > 0 ? themes : analysis.keyTopics;
      
      // Filter topics to exclude entity fragments
      const filteredTopics = topics.filter(topic => {
        // Check if this topic is just a part of an entity we need to preserve
        for (const entity of preservedEntities) {
          if (entity.toLowerCase().includes(topic.toLowerCase()) && entity.toLowerCase() !== topic.toLowerCase()) {
            return false;
          }
        }
        return true;
      });
      
      // INTRO: Extract and adapt sentence structures from the original text
      let introSentence = "";
      if (sentences.length > 0) {
        // Find a good candidate sentence to adapt for intro
        const introductorySentences = sentences.slice(0, Math.min(3, sentences.length));
        const sentenceStructures = extractSentenceStructures(introductorySentences);
        
        if (filteredTopics.length > 0 && sentenceStructures.length > 0) {
          const mainTopic = filteredTopics[0];
          const structure = sentenceStructures[Math.floor(Math.random() * sentenceStructures.length)];
          introSentence = applySentenceStructure(structure, mainTopic, analysis);
          usedPhrases.add(mainTopic);
        } else if (sentenceStructures.length > 0) {
          // Just adapt the first sentence if no topics
          const structure = sentenceStructures[0];
          introSentence = adaptSentence(structure, analysis);
        } else {
          // Extract a sentence from the original text as intro
          introSentence = extractKey(sentences, 0, 0.3);
        }
      }
      
      // BODY: Extract key insights from different sections of the text to ensure variety
      const keyInsights = extractDistinctInsights(sections, filteredTopics, usedPhrases);
      
      // Select insights for the body
      const bodyCount = Math.max(1, sentenceCount - 2); // Adjust based on required sentence count
      const bodyInsights = keyInsights.slice(0, bodyCount);
      
      // Create body sentences with varied structures
      const bodySentences = bodyInsights.map(insight => {
        // Assess confidence in this particular sentence
        const confidence = assessTextConfidence(insight, analysis);
        
        // Higher confidence = preserve more of original text
        if (confidence > 0.6) {
          // Minimal rewriting for high-confidence text
          return rewriteAdaptively(insight, analysis, filteredTopics, usedPhrases);
        } else {
          // More aggressive rewriting/generation for lower-confidence text
          return generateDynamicSentence(insight, filteredTopics, usedPhrases, sentences, analysis);
        }
      });
      
      // CONCLUSION: Create a conclusion by adapting an actual concluding sentence
      let conclusionSentence = "";
      
      // Try to find an actual concluding sentence
      const concludingSentences = sentences.slice(-2);
      const hasActualConclusion = concludingSentences.some(s => 
        s.match(/(?:in conclusion|to summarize|overall|ultimately|therefore|thus)/i)
      );
      
      if (hasActualConclusion) {
        // Use the actual conclusion from the text
        const actualConclusion = concludingSentences.find(s => 
          s.match(/(?:in conclusion|to summarize|overall|ultimately|therefore|thus)/i)
        );
        conclusionSentence = rewriteAdaptively(actualConclusion, analysis, filteredTopics, usedPhrases);
      } else {
        // Extract a potential conclusion sentence
        const unused = filteredTopics.filter(t => !usedPhrases.has(t))[0] || "";
        if (unused) {
          // Create a conclusion using unused topic
          const concludingStructures = extractSentenceStructures(sentences.slice(-3));
          if (concludingStructures.length > 0) {
            conclusionSentence = applySentenceStructure(
              concludingStructures[Math.floor(Math.random() * concludingStructures.length)], 
              unused, 
              analysis
            );
          } else {
            // Extract a sentence from the original text
            conclusionSentence = extractKey(sentences, -1, 0.7);
          }
        } else {
          // Extract a sentence from the original text
          conclusionSentence = extractKey(sentences, -1, 0.7);
        }
      }
      
      // Combine all parts without unnecessary transitions
      const rawSummary = introSentence + ' ' + bodySentences.join(' ') + ' ' + conclusionSentence;
      
      // Final quality control check
      return improveTextQuality(rawSummary);
    }
  
    /**
     * Extract sentence structures from example sentences
     */
    function extractSentenceStructures(sentences) {
      const structures = [];
      sentences.forEach(sentence => {
        const tokens = sentence.split(/\s+/);
        
        // Only use sentences with reasonable length
        if (tokens.length < 5 || tokens.length > 15) return;
        
        // Create a generic structure
        const structure = {
          original: sentence,
          verbs: [],
          prepositions: [],
          firstWord: tokens[0].toLowerCase()
        };
        
        // Extract verbs
        for (let i = 0; i < tokens.length; i++) {
          const token = tokens[i].toLowerCase();
          if (token.match(/\b(?:is|are|was|discuss|highlight|show|reveal|present|describe|examine)\w*\b/)) {
            structure.verbs.push({word: token, position: i});
          }
          if (token.match(/\b(?:in|on|to|for|from|with|by|about|through)\b/)) {
            structure.prepositions.push({word: token, position: i});
          }
        }
        
        // Only add structures with at least one verb
        if (structure.verbs.length > 0) {
          structures.push(structure);
        }
      });
      
      return structures;
    }
  
    /**
     * Apply a sentence structure to create a new sentence
     */
    function applySentenceStructure(structure, topic, analysis) {
      const verb = structure.verbs[0];
      const preposition = structure.prepositions[0];
      
      // Use a relevant verb from the analysis
      const analysisVerbs = analysis.actionVerbs || [];
      const relevantVerb = analysisVerbs.length > 0 ? 
        analysisVerbs[Math.floor(Math.random() * analysisVerbs.length)] : 
        verb ? verb.word : "discusses";
      
      // Construct a new sentence based on the structure
      let newSentence;
      
      // Adapt based on structure
      if (structure.firstWord.match(/^(?:this|the|these|those)$/)) {
        // For sentences starting with determiners, create a statement about the topic
        if (structure.verbs.length > 0 && structure.verbs[0].position < 3) {
          // The X is/discusses...
          newSentence = `${capitalizeFirstLetter(topic)} ${conjugateVerb(relevantVerb)} key information presented.`;
        } else {
          // The X in the Y...
          newSentence = `${capitalizeFirstLetter(topic)} ${preposition ? preposition.word : 'in'} this context provides important insights.`;
        }
      } else if (structure.verbs.length > 1) {
        // For multi-verb structures, create a more complex sentence
        newSentence = `${capitalizeFirstLetter(topic)} ${conjugateVerb(relevantVerb)} how information can be effectively processed.`;
      } else {
        // Default structure
        newSentence = `${capitalizeFirstLetter(topic)} ${conjugateVerb(relevantVerb)} concepts from various perspectives.`;
      }
      
      return cleanText(newSentence);
    }
  
    /**
     * Adapt a sentence based on analysis
     */
    function adaptSentence(structure, analysis) {
      // Get a relevant action verb from analysis
      const verbs = analysis.actionVerbs || [];
      const verb = verbs.length > 0 ? verbs[Math.floor(Math.random() * verbs.length)] : "presents";
      
      // Get a relevant topic
      const topics = analysis.keyTopics || [];
      const topic = topics.length > 0 ? topics[0] : "information";
      
      // Create an adapted sentence
      return `${capitalizeFirstLetter(topic)} ${conjugateVerb(verb)} important concepts in context.`;
    }
  
    /**
     * Extract a key sentence from the original text
     */
    function extractKey(sentences, position, confidence = 0.5) {
      if (!sentences || sentences.length === 0) {
        return "Information is presented with context and detail.";
      }
      
      // Position can be negative (from the end) or positive (from the start)
      const idx = position < 0 ? Math.max(0, sentences.length + position) : Math.min(position, sentences.length - 1);
      
      // Get the actual sentence
      let sentence = sentences[idx];
      
      // Clean up the sentence
      return rewriteAdaptively(sentence, {}, [], new Set(), confidence);
    }
  
    /**
     * Generate a dynamic sentence without fixed templates
     */
    function generateDynamicSentence(baseSentence, topics, usedPhrases, originalSentences, analysis) {
      // Check if there's an unused topic
      const unusedTopics = topics.filter(t => !usedPhrases.has(t));
      
      if (unusedTopics.length > 0) {
        const topic = unusedTopics[0];
        usedPhrases.add(topic);
        
        // Get sentence structures from original
        const structures = extractSentenceStructures(originalSentences.slice(0, 5));
        if (structures.length > 0) {
          // Apply a random structure
          return applySentenceStructure(
            structures[Math.floor(Math.random() * structures.length)],
            topic,
            analysis
          );
        }
        
        // Extract verb from analysis or base sentence
        const verbMatch = baseSentence.match(/\b(?:is|are|shows|presents|discusses|describes|reveals|provides|addresses)\b/i);
        const verb = verbMatch ? verbMatch[0].toLowerCase() : 
          (analysis.actionVerbs && analysis.actionVerbs.length > 0) ? 
            analysis.actionVerbs[0] : "relates to";
        
        // Create a new sentence
        return cleanText(`${capitalizeFirstLetter(topic)} ${verb} key concepts in this content.`);
      }
      
      // If no unused topics, just rewrite the base sentence
      return rewriteAdaptively(baseSentence, {}, topics, usedPhrases);
    }
  
    /**
     * Simple conjugation for a subset of verbs
     */
    function conjugateVerb(verb) {
      const presentTense = {
        'discuss': 'discusses',
        'show': 'shows',
        'reveal': 'reveals',
        'present': 'presents',
        'describe': 'describes',
        'examine': 'examines',
        'provide': 'provides',
        'address': 'addresses',
        'highlight': 'highlights',
        'demonstrate': 'demonstrates',
        'explain': 'explains',
        'explore': 'explores',
        'analyze': 'analyzes'
      };
      
      return presentTense[verb] || `${verb}s`;
    }
  
    /**
     * Clean text by fixing spacing, punctuation, etc.
     */
    function cleanText(text) {
      if (!text) return "";
      
      // Fix spacing issues
      let result = text.replace(/\s+/g, ' ').trim();
      result = result.replace(/\s+([,.;:])/g, '$1');
      
      // Ensure proper capitalization
      result = result.charAt(0).toUpperCase() + result.slice(1);
      
      // Ensure sentence ends with punctuation
      if (!result.match(/[.!?]$/)) {
        result += '.';
      }
      
      return result;
    }
  
    /**
     * Generate a biography-focused adaptive summary
     */
    function generateAdaptiveBiography(sentences, analysis) {
      // Track used phrases to avoid repetition
      const usedPhrases = new Set();
      const preservedEntities = new Set();
      
      // Add entities to preserved set to ensure they're not fragmented
      if (analysis.mainEntities && analysis.mainEntities.length > 0) {
        analysis.mainEntities.forEach(entity => preservedEntities.add(entity));
      }
      
      // Identify the main person (usually the first entity)
      const mainPerson = analysis.mainEntities && analysis.mainEntities.length > 0 ? 
        analysis.mainEntities[0] : null;
      
      if (!mainPerson) {
        // Fallback to general summary if no main person is identified
        return generateAdaptiveSummary(sentences, analysis, [], 3);
      }
      
      // Create biography intro using sentence structure extraction
      const introSentences = sentences.slice(0, Math.min(3, sentences.length));
      const introStructures = extractSentenceStructures(introSentences);
      
      // Generate an intro focused on the person without templates
      let introSentence;
      if (introStructures.length > 0) {
        // Use existing sentence structure
        const structure = introStructures[Math.floor(Math.random() * introStructures.length)];
        const verb = (analysis.actionVerbs && analysis.actionVerbs.length > 0) ? 
          analysis.actionVerbs[0] : "presents";
        introSentence = `${mainPerson} ${conjugateVerb(verb)} important contributions in this context.`;
      } else {
        // Extract a relevant sentence from original text
        const personSentences = sentences.filter(s => s.includes(mainPerson));
        introSentence = personSentences.length > 0 ? 
          rewriteAdaptively(personSentences[0], analysis, [], usedPhrases, 0.7) : 
          `${mainPerson} is examined in this biographical content.`;
      }
      
      // Mark person as used
      usedPhrases.add(mainPerson);
      
      // Find key biographical sentences
      const keyBioSentences = [];
      sentences.forEach(sentence => {
        // Check if sentence contains main person or variants
        const nameParts = mainPerson.split(/\s+/);
        const lastName = nameParts[nameParts.length - 1];
        const containsName = sentence.includes(mainPerson) || 
                           (lastName.length > 2 && sentence.includes(lastName));
        
        // Check for biographical indicators
        const hasBioIndicator = /\b(?:born|life|career|work|achievement|position|led|elected|served)\b/i.test(sentence);
        
        // Score the sentence based on biographical relevance
        let score = 0;
        if (containsName) score += 2;
        if (hasBioIndicator) score += 1;
        
        if (score >= 2) {
          keyBioSentences.push(sentence);
        }
      });
      
      // Select key biographical sentences
      const bodySentences = keyBioSentences
        .slice(0, Math.min(2, keyBioSentences.length))
        .map(sentence => rewriteAdaptively(sentence, analysis, [], usedPhrases, 0.7));
      
      // Create concluding sentence by adapting from original text
      let conclusionSentence;
      const concludingSentences = sentences.slice(-2);
      const relevantConclusion = concludingSentences.find(s => s.includes(mainPerson) || s.includes(nameParts[nameParts.length - 1]));
      
      if (relevantConclusion) {
        conclusionSentence = rewriteAdaptively(relevantConclusion, analysis, [], usedPhrases, 0.7);
      } else {
        // Find any sentence about impacts, contributions, or importance
        const impactSentences = sentences.filter(s => 
          /\b(?:impact|influence|contribution|important|significant|legacy)\b/i.test(s)
        );
        
        if (impactSentences.length > 0) {
          const impactSentence = impactSentences[Math.floor(Math.random() * impactSentences.length)];
          conclusionSentence = rewriteAdaptively(impactSentence, analysis, [], usedPhrases, 0.7);
          
          // Ensure the person is mentioned
          if (!conclusionSentence.includes(mainPerson)) {
            conclusionSentence = `${mainPerson}'s ${conclusionSentence.charAt(0).toLowerCase()}${conclusionSentence.slice(1)}`;
          }
        } else {
          // Extract a closing sentence
          conclusionSentence = extractKey(sentences, -1, 0.8);
        }
      }
      
      // Combine all parts
      const rawSummary = [introSentence, ...bodySentences, conclusionSentence].join(' ');
      
      // Final quality control check
      return improveTextQuality(rawSummary);
    }
  
    /* ---------------- LLM Simulation ---------------- */
  
    async function processWithLLM(prompt, options = {}) {
      console.log("Processing with simulated LLM:", prompt.substring(0, 100) + "...");
      await new Promise(resolve => setTimeout(resolve, 300));
      const inputText = prompt.includes("Summary:")
        ? prompt.split("Summary:")[1]
        : prompt.split("\n\n")[1] || prompt;
      const requestedSentenceCount = options.sentenceCount || 3;
      const sentences = inputText.match(/[^.!?]+[.!?]+/g) || [];
      if (!sentences.length) return inputText;
      const analysisResult = analyzeTextForSummarization(inputText, sentences);
      const contentType = options.contentType || detectContentType(inputText);
      if (prompt.includes("themes:") || prompt.includes("incorporating these key themes")) {
        const themesMatch = prompt.match(/themes:\s*([^.\n]+)/);
        const themes = themesMatch
          ? themesMatch[1].split(",").map(t => t.trim())
          : analysisResult.keyTopics;
        return generateAdaptiveSummary(sentences, analysisResult, themes, requestedSentenceCount);
      } else if (contentType === "biographical") {
        return generateAdaptiveBiography(sentences, analysisResult);
      } else {
        return generateAdaptiveSummary(sentences, analysisResult, [], requestedSentenceCount);
      }
    }
  
    function detectContentType(text) {
      const complexNamePattern = /\b[A-Z][a-zÀ-ÿ]+(?:\s+(?:[A-Z][a-zÀ-ÿ]+|d[aeo]\s+[A-Z][a-zÀ-ÿ]+|d[aeo]|van|von|del|la))+\b/g;
      const complexNames = text.match(complexNamePattern) || [];
      const namePattern = /\b[A-Z][a-zÀ-ÿ]+(?:\s+[A-Z][a-zÀ-ÿ]+){1,3}\b/g;
      const standardNames = text.match(namePattern) || [];
      const allNames = [...new Set([...complexNames, ...standardNames])];
      const bioIndicators = ["born", "died", "career", "life", "biography"];
      const hasBioIndicators = bioIndicators.some(i => text.toLowerCase().includes(i));
      if (
        (allNames.length > 0 &&
          allNames.some(name => {
            const nameParts = name.split(/\s+/);
            const lastName = nameParts[nameParts.length - 1];
            // Fix regex syntax error and remove backticks
            const fullNameCount = (text.match(new RegExp(`\\b${name.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&`)}\\b`, "g")) || []).length;
            const lastNameCount = lastName.length > 2 ? (text.match(new RegExp(`\\b${lastName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&`)}\\b`, "g")) || []).length : 0;
            return fullNameCount + lastNameCount >= 3;
          })) &&
        hasBioIndicators
      ) {
        return "biographical";
      }
      const technicalWords = ["data", "algorithm", "system", "technology", "software"];
      const technicalCount = technicalWords.reduce(
        (cnt, word) => cnt + ((text.toLowerCase().match(new RegExp(`\\b${word}\\w*\\b`, "g")) || []).length),
        0
      );
      if (technicalCount > 3) return "technical";
      const academicWords = ["research", "study", "analysis", "literature"];
      const academicCount = academicWords.reduce(
        (cnt, word) => cnt + ((text.toLowerCase().match(new RegExp(`\\b${word}\\w*\\b`, "g")) || []).length),
        0
      );
      if (academicCount > 3) return "academic";
      return "general";
    }
  
    function analyzeContent(text) {
      const contentType = detectContentType(text);
      return {
        contentType,
        estimatedReadingTime: Math.ceil(text.split(/\s+/).length / 200),
        complexity: contentType === "technical" || contentType === "academic" ? "high" : "moderate",
      };
    }
  
    /* ---------------- Public API ---------------- */
    return {
      async generateSummary(text, options = {}) {
        const contentType = options.contentType || detectContentType(text);
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
        const prompt = promptTemplate(text);
        return await processWithLLM(prompt, options);
      },
  
      async enhanceSummary(summary, keyElements, options = {}) {
        let promptTemplate;
        let elements;
        if (keyElements.themes && keyElements.themes.length > 0) {
          promptTemplate = PROMPT_TEMPLATES.enhance.withThemes;
          elements = keyElements.themes.slice(0, 5).map(t => (typeof t === "string" ? t : t.text));
        } else if (keyElements.entities && keyElements.entities.length > 0) {
          promptTemplate = PROMPT_TEMPLATES.enhance.withEntities;
          elements = keyElements.entities.slice(0, 5).map(e => (typeof e === "string" ? e : e.text));
        } else {
          if (options.contentType === "academic") {
            promptTemplate = PROMPT_TEMPLATES.enhance.academic;
            return await processWithLLM(promptTemplate(summary), options);
          } else {
            promptTemplate = PROMPT_TEMPLATES.enhance.simplified;
            return await processWithLLM(promptTemplate(summary), options);
          }
        }
        const prompt = promptTemplate(summary, elements);
        return await processWithLLM(prompt, options);
      },
  
      analyzeContent,
      detectContentType,
    };
  })();
