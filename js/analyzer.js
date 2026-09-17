/**
 * analyzer.js
 * Core password analysis logic. The password is processed only in memory.
 */

const Analyzer = (() => {
  function checkLength(password) {
    const len = password.length;
    if (len === 0) return { category: "empty", len, feedback: "No password entered yet." };
    if (len <= 5) return { category: "very-short", len, feedback: "Password is very short and easy to guess." };
    if (len <= 9) return { category: "short", len, feedback: "Password is short. A longer password or passphrase is recommended." };
    if (len <= 13) return { category: "reasonable", len, feedback: "Reasonable length, but longer is generally better." };
    if (len <= 19) return { category: "long", len, feedback: "Good password length." };
    return { category: "very-long", len, feedback: "Very long password or passphrase." };
  }

  function checkCharacterTypes(password) {
    return {
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      digits: /[0-9]/.test(password),
      symbols: /[^A-Za-z0-9\s]/.test(password),
      spaces: /\s/.test(password)
    };
  }

  function checkCommonPassword(password, commonList) {
    if (!password) return { isCommon: false };
    return { isCommon: Patterns.isInList(password, commonList) };
  }

  function checkPatterns(password) {
    const findings = [];
    if (!password) return findings;

    const seq = Patterns.findSequentialRun(password);
    if (seq) findings.push({ type: "sequential", message: "Contains a predictable sequential pattern." });

    const kb = Patterns.findKeyboardPattern(password);
    if (kb) findings.push({ type: "keyboard", message: "Contains a predictable keyboard pattern." });

    const block = Patterns.findRepeatedBlock(password);
    if (block) findings.push({ type: "repeated-block", message: "Contains a repeated block of characters." });

    const wordNum = Patterns.findWordPlusNumber(password);
    if (wordNum) {
      findings.push({
        type: "word-plus-number",
        message: wordNum.looksLikeYear
          ? "Follows a predictable word + year pattern."
          : "Follows a predictable word + number pattern."
      });
    }

    return findings;
  }

  function checkRepetition(password) {
    if (!password) return null;
    const rep = Patterns.findRepeatedCharacters(password);
    if (!rep) return null;
    return {
      type: "repetition",
      message: "Contains repeated characters in a row."
    };
  }

  function checkDictionaryWords(password, wordList) {
    if (!password) return null;

    const lower = password.toLowerCase();
    if (wordList.includes(lower)) return { viaSubstitution: false, withSuffix: false };

    const stripped = Patterns.matchesWordWithSuffixStripped(password, wordList);
    if (stripped) return { viaSubstitution: false, withSuffix: true };

    const deLeeted = Patterns.normalizeLeet(password);
    if (deLeeted !== lower && wordList.includes(deLeeted)) {
      return { viaSubstitution: true, withSuffix: false };
    }

    return null;
  }

  function checkLeetSubstitution(password, commonList) {
    if (!password) return null;

    const lower = password.toLowerCase();
    const deLeeted = Patterns.normalizeLeet(password);
    if (deLeeted !== lower && commonList.includes(deLeeted)) {
      return { hadDigitSuffix: false };
    }

    const digitSuffixMatch = password.match(/^(.*?)(\d{1,4})$/);
    if (digitSuffixMatch) {
      const [, prefix, suffix] = digitSuffixMatch;
      const deLeetedPrefix = Patterns.normalizeLeet(prefix);
      if (deLeetedPrefix.length >= 3 && commonList.includes(deLeetedPrefix)) {
        return { hadDigitSuffix: true, suffixLength: suffix.length };
      }
    }

    return null;
  }

  function estimatePoolSize(charTypes) {
    let pool = 0;
    if (charTypes.lowercase) pool += 26;
    if (charTypes.uppercase) pool += 26;
    if (charTypes.digits) pool += 10;
    if (charTypes.symbols) pool += 32;
    if (charTypes.spaces) pool += 1;
    return pool || 1;
  }

  /**
   * This is a theoretical character-set estimate, not measured human-password
   * entropy. It assumes independent uniform random selection from the detected pool.
   */
  function estimateEntropy(password, charTypes, weaknessFlags) {
    const len = password.length;
    if (len === 0) return { rawBits: 0, guessability: "No password entered" };

    const pool = estimatePoolSize(charTypes);
    const rawBits = len * Math.log2(pool);

    let guessability = "No obvious predictable patterns detected";
    if (weaknessFlags.isCommon || weaknessFlags.dictionaryMatch || weaknessFlags.leetMatch) {
      guessability = "High predictability: common/dictionary-based pattern detected";
    } else if (weaknessFlags.patternCount > 0 || weaknessFlags.repetition) {
      guessability = "Increased predictability: structural pattern detected";
    }

    return {
      rawBits: Math.round(rawBits * 10) / 10,
      guessability
    };
  }

  function calculateStrength(password, signals) {
    const { lengthInfo, charTypes, isCommon, patternFindings, repetitionFinding,
      dictionaryMatch, leetMatch } = signals;

    if (lengthInfo.category === "empty") return { score: 0, level: "VERY WEAK" };

    const lengthScoreMap = {
      "very-short": 8,
      "short": 28,
      "reasonable": 52,
      "long": 74,
      "very-long": 90
    };

    let score = lengthScoreMap[lengthInfo.category];

    // Character diversity is deliberately a small bonus, not the main measure.
    const diversityCount = [charTypes.lowercase, charTypes.uppercase, charTypes.digits, charTypes.symbols]
      .filter(Boolean).length;
    score += Math.min(diversityCount * 3, 12);

    // A common password is overwhelmingly guessable, so cap it aggressively.
    if (isCommon) score = Math.min(score, 5);

    // A common password disguised with leetspeak should remain weak.
    if (leetMatch) score = Math.min(score, 15);

    // Apply dictionary and structural penalties without double-counting the same issue.
    if (dictionaryMatch) score -= dictionaryMatch.withSuffix ? 30 : 40;
    if (patternFindings.length > 0) score -= Math.min(patternFindings.length, 2) * 18;
    if (repetitionFinding && !patternFindings.some((f) => f.type === "repeated-block")) score -= 18;

    score = Math.max(0, Math.min(100, Math.round(score)));

    let level;
    if (score < 20) level = "VERY WEAK";
    else if (score < 40) level = "WEAK";
    else if (score < 60) level = "FAIR";
    else if (score < 80) level = "STRONG";
    else level = "VERY STRONG";

    return { score, level };
  }

  function analyzePassword(password, datasets) {
    const { commonPasswords, commonWords } = datasets;
    const lengthInfo = checkLength(password);
    const charTypes = checkCharacterTypes(password);
    const commonResult = checkCommonPassword(password, commonPasswords);
    const patternFindings = checkPatterns(password);
    const repetitionFinding = checkRepetition(password);
    const dictionaryMatch = checkDictionaryWords(password, commonWords);
    const leetMatch = checkLeetSubstitution(password, commonPasswords);

    const strength = calculateStrength(password, {
      lengthInfo,
      charTypes,
      isCommon: commonResult.isCommon,
      patternFindings,
      repetitionFinding,
      dictionaryMatch,
      leetMatch
    });

    const entropy = estimateEntropy(password, charTypes, {
      isCommon: commonResult.isCommon,
      dictionaryMatch,
      leetMatch,
      patternCount: patternFindings.length,
      repetition: Boolean(repetitionFinding)
    });

    return {
      lengthInfo,
      charTypes,
      isCommon: commonResult.isCommon,
      patternFindings,
      repetitionFinding,
      dictionaryMatch,
      leetMatch,
      strength,
      entropy
    };
  }

  return { analyzePassword };
})();
