/**
 * recommendations.js
 * Generates recommendations from detected weaknesses.
 */

const Recommendations = (() => {
  function generateRecommendations(result) {
    const tips = [];

    if (result.lengthInfo.category === "empty") {
      return ["Enter a password above to see recommendations."];
    }

    if (result.lengthInfo.category === "very-short" || result.lengthInfo.category === "short") {
      tips.push("Use a longer password or passphrase. Longer passwords are generally more resistant to guessing.");
    }

    if (result.isCommon) {
      tips.push("Avoid commonly used passwords because attackers try these early in password-guessing attacks.");
    }

    if (result.leetMatch) {
      tips.push(result.leetMatch.hadDigitSuffix
        ? "Simple character substitutions combined with a numeric suffix do not make a common password meaningfully safer."
        : "Simple substitutions such as @ for a or 0 for o do not make a common password meaningfully safer.");
    }

    if (result.dictionaryMatch) {
      tips.push("Avoid common dictionary words by themselves or with a predictable number/year attached.");
    }

    result.patternFindings.forEach((f) => {
      if (f.type === "sequential") tips.push("Avoid predictable sequences such as 1234 or abcd.");
      else if (f.type === "keyboard") tips.push("Avoid keyboard patterns such as qwerty or asdfgh.");
      else if (f.type === "repeated-block") tips.push("Avoid repeating a short block of characters to make a password look longer.");
      else if (f.type === "word-plus-number") tips.push("Avoid predictable word + number/year structures.");
    });

    if (result.repetitionFinding && !result.patternFindings.some((f) => f.type === "repeated-block")) {
      tips.push("Avoid repeated characters such as aaaa or 1111.");
    }

    // General good practice. These are deliberately concise and always relevant.
    tips.push("Use a unique password for each account to reduce the impact of credential stuffing.");
    tips.push("Avoid personal information such as names, birthdates, or phone numbers.");
    tips.push("Consider using a password manager to create and store unique passwords.");

    if (
      tips.length === 3 &&
      (result.strength.level === "STRONG" || result.strength.level === "VERY STRONG") &&
      result.patternFindings.length === 0 &&
      !result.isCommon &&
      !result.dictionaryMatch &&
      !result.repetitionFinding &&
      !result.leetMatch
    ) {
      tips.unshift("Good length and no obvious predictable patterns were detected.");
    }

    return [...new Set(tips)];
  }

  return { generateRecommendations };
})();
