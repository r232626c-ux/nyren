/**
 * Shona Grammar Parser & Analyzer
 * Provides real-time grammar feedback for learners
 */

class ShonaGrammarParser {
  constructor() {
    // Bantu noun class prefixes (Shona)
    this.nounClasses = {
      1: { prefix: 'mu', plural: 2, meaning: 'person', example: 'munhu' },
      2: { prefix: 'va', singular: 1, meaning: 'people', example: 'vanhu' },
      3: { prefix: 'mu', plural: 4, meaning: 'tree/plant', example: 'muti' },
      4: { prefix: 'mi', singular: 3, meaning: 'trees/plants', example: 'miti' },
      5: { prefix: 'ri', plural: 6, meaning: 'fruit/thing', example: 'rimwa' },
      6: { prefix: 'ma', singular: 5, meaning: 'fruits/things', example: 'mamwa' },
      7: { prefix: 'chi', plural: 8, meaning: 'thing/language', example: 'chirungu' },
      8: { prefix: 'zvi', singular: 7, meaning: 'things/languages', example: 'zvirungu' },
      9: { prefix: 'n', plural: 10, meaning: 'animal/thing', example: 'nzira' },
      10: { prefix: 'n/z', singular: 9, meaning: 'animals/things', example: 'nzira' },
    };

    // Subject pronouns (verb prefixes)
    this.subjectMarkers = {
      'ndi': 'I',
      'u': 'you (singular)',
      'a': 'he/she/it',
      'ti': 'we',
      'mu': 'you (plural)',
      'va': 'they',
    };

    // Tense markers
    this.tenseMarkers = {
      present: { marker: 'i', example: 'inda (I eat)' },
      past: { marker: 'a', example: 'andida (I ate)' },
      future: { marker: 'chi', example: 'ndichida (I will eat)' },
      habitual: { marker: 'i', example: 'inda (I usually eat)' },
      perfect: { marker: 'a', example: 'anda (I have eaten)' },
    };

    // Common errors & corrections
    this.commonErrors = [
      {
        pattern: /^[aeiou]/,
        issue: 'Words starting with vowels may be missing noun class prefix',
        fix: 'Check if this word needs a noun class prefix',
      },
      {
        pattern: /[a-z]{10,}/,
        issue: 'Very long word - check for compound words or verb extensions',
        fix: 'Consider breaking into components: root + prefix + suffix',
      },
    ];
  }

  /**
   * Parse a Shona word and extract components
   */
  parseWord(word) {
    if (!word || word.length === 0) return null;

    const analysis = {
      word: word,
      components: {},
      nounClass: null,
      errors: [],
      suggestions: [],
    };

    // Check noun class prefix
    for (const [classNum, classInfo] of Object.entries(this.nounClasses)) {
      if (word.startsWith(classInfo.prefix)) {
        analysis.nounClass = {
          class: classNum,
          prefix: classInfo.prefix,
          meaning: classInfo.meaning,
        };
        analysis.components.prefix = classInfo.prefix;
        analysis.components.root = word.substring(classInfo.prefix.length);
        break;
      }
    }

    // Check subject marker if looks like verb
    for (const [marker, meaning] of Object.entries(this.subjectMarkers)) {
      if (word.startsWith(marker)) {
        analysis.components.subjectMarker = { marker, meaning };
        break;
      }
    }

    // Validate word structure
    this._validateWordStructure(word, analysis);

    return analysis;
  }

  /**
   * Analyze a complete sentence
   */
  analyzeSentence(sentence) {
    if (!sentence || sentence.length === 0) return null;

    const analysis = {
      sentence: sentence,
      words: [],
      structure: {},
      grammaticalErrors: [],
      suggestions: [],
      confidence: 0,
    };

    // Split into words
    const words = sentence.toLowerCase().trim().split(/\s+/);

    // Parse each word
    analysis.words = words.map((word) => ({
      word,
      analysis: this.parseWord(word),
    }));

    // Check sentence-level grammar
    this._validateSentenceStructure(analysis);

    // Calculate confidence score
    analysis.confidence = this._calculateConfidence(analysis);

    return analysis;
  }

  /**
   * Provide feedback on user input
   */
  provideFeedback(userInput, expectedOutput = null) {
    const feedback = {
      input: userInput,
      isCorrect: false,
      analysis: this.analyzeSentence(userInput),
      errors: [],
      corrections: [],
      explanations: [],
      learningTips: [],
    };

    if (expectedOutput) {
      feedback.isCorrect = this._compareOutput(userInput, expectedOutput);
      feedback.expectedOutput = expectedOutput;
      feedback.expectedAnalysis = this.analyzeSentence(expectedOutput);
    }

    // Generate explanations for errors found
    feedback.analysis.grammaticalErrors.forEach((error) => {
      feedback.explanations.push({
        error: error.error,
        rule: error.rule,
        example: error.example,
      });
    });

    // Add learning tips
    feedback.learningTips = this._generateLearningTips(feedback.analysis);

    return feedback;
  }

  /**
   * Suggest corrections for a word
   */
  suggestCorrections(incorrectWord, context = {}) {
    const suggestions = [];
    const analysis = this.parseWord(incorrectWord);

    // Check if word is missing prefix
    if (!analysis.nounClass && context.wordClass) {
      const appropriateClass = this.nounClasses[context.wordClass];
      if (appropriateClass) {
        suggestions.push({
          suggestion: appropriateClass.prefix + incorrectWord,
          reason: `Missing noun class prefix for class ${context.wordClass}`,
          probability: 0.8,
        });
      }
    }

    // Check for common conjugation errors
    if (context.tense && !analysis.components.tenseMarker) {
      const tenseInfo = this.tenseMarkers[context.tense];
      if (tenseInfo) {
        const corrected = this._applyConcord(incorrectWord, context.tense);
        suggestions.push({
          suggestion: corrected,
          reason: `Missing or incorrect ${context.tense} marker`,
          probability: 0.7,
        });
      }
    }

    return suggestions;
  }

  // ========== PRIVATE METHODS ==========

  _validateWordStructure(word, analysis) {
    // Check word length
    if (word.length < 2) {
      analysis.errors.push('Word too short - may be incomplete');
      return;
    }

    // Check for valid Shona phonemes
    const validPhonemes = /^[a-z]+$/;
    if (!validPhonemes.test(word)) {
      analysis.errors.push('Contains non-alphabetic characters');
    }

    // Apply common error patterns
    this.commonErrors.forEach((errorPattern) => {
      if (errorPattern.pattern.test(word)) {
        analysis.suggestions.push({
          issue: errorPattern.issue,
          fix: errorPattern.fix,
        });
      }
    });
  }

  _validateSentenceStructure(analysis) {
    if (analysis.words.length === 0) return;

    // Check subject-verb agreement (basic)
    const firstWord = analysis.words[0];
    if (firstWord.analysis?.components?.subjectMarker) {
      // Verify verb conjugation matches subject marker
      analysis.structure.hasSubject = true;
    }

    // Check for common SVO (Subject-Verb-Object) pattern violations
    if (analysis.words.length >= 2) {
      const hasVerb = analysis.words.some((w) => w.analysis?.components?.subjectMarker);
      if (!hasVerb) {
        analysis.grammaticalErrors.push({
          error: 'No verb detected in sentence',
          rule: 'Sentences require a conjugated verb',
          example: 'Correct: "Ndiri munhu" (I am a person)',
        });
      }
    }
  }

  _compareOutput(input, expected) {
    // Normalize whitespace
    const normalizedInput = input.toLowerCase().trim();
    const normalizedExpected = expected.toLowerCase().trim();

    // Exact match
    if (normalizedInput === normalizedExpected) return true;

    // Check word-by-word match (order-independent for some contexts)
    const inputWords = normalizedInput.split(/\s+/);
    const expectedWords = normalizedExpected.split(/\s+/);

    if (inputWords.length !== expectedWords.length) return false;

    // Check each word
    return inputWords.every((word, idx) => word === expectedWords[idx]);
  }

  _applyConcord(word, tense) {
    const tenseInfo = this.tenseMarkers[tense];
    if (!tenseInfo) return word;

    // This is simplified - real implementation would be more complex
    const analysis = this.parseWord(word);
    const root = analysis.components.root || word;

    return tenseInfo.marker + root;
  }

  _calculateConfidence(analysis) {
    let score = 100;

    // Deduct for errors
    score -= analysis.grammaticalErrors.length * 20;
    analysis.words.forEach((w) => {
      score -= w.analysis?.errors?.length * 10 || 0;
    });

    return Math.max(0, Math.min(100, score));
  }

  _generateLearningTips(analysis) {
    const tips = [];

    // Noun class tips
    const nounClasses = analysis.words
      .filter((w) => w.analysis?.nounClass)
      .map((w) => w.analysis.nounClass);

    if (nounClasses.length > 0) {
      tips.push({
        tip: `You used ${nounClasses.length} noun class prefixes. Remember they must agree with adjectives and verbs!`,
        type: 'grammar',
      });
    }

    // Error-based tips
    if (analysis.grammaticalErrors.length > 0) {
      tips.push({
        tip: 'Review the rules for subject-verb agreement before your next lesson',
        type: 'improvement',
      });
    }

    return tips;
  }
}

module.exports = new ShonaGrammarParser();
