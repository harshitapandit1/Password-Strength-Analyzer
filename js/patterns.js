/**
 * patterns.js
 * -----------
 * Pure functions that detect predictable structures inside a password.
 * None of these functions log, store, or transmit the password anywhere.
 * They only return plain data describing what was found.
 */

const Patterns = (() => {

  const KEYBOARD_ROWS = [
    "1234567890",
    "qwertyuiop",
    "asdfghjkl",
    "zxcvbnm",
    "qazwsxedc",
    "1qaz2wsx3edc"
  ];

  // Common leetspeak substitutions, used to "normalize" a password before
  // comparing it against dictionary/common-password lists.
  const LEET_MAP = {
    "@": "a", "4": "a",
    "3": "e",
    "1": "i", "!": "i",
    "0": "o",
    "$": "s", "5": "s",
    "7": "t", "+": "t"
  };

  /** Reverses a string. */
  function reverse(str) {
    return str.split("").reverse().join("");
  }

  /** Replaces leetspeak characters with their letter equivalents. */
  function normalizeLeet(password) {
    return password
      .split("")
      .map((ch) => LEET_MAP[ch] !== undefined ? LEET_MAP[ch] : ch)
      .join("")
      .toLowerCase();
  }

  /**
   * Finds runs of ascending or descending consecutive characters
   * (works for both digits and letters), e.g. "1234", "dcba".
   * Returns the longest run found, or null.
   */
  function findSequentialRun(password) {
    const lower = password.toLowerCase();
    let bestLen = 0;
    let bestRun = null;

    for (let i = 0; i < lower.length - 1; i++) {
      let runLen = 1;
      let ascending = null;

      for (let j = i + 1; j < lower.length; j++) {
        const diff = lower.charCodeAt(j) - lower.charCodeAt(j - 1);
        if (ascending === null && (diff === 1 || diff === -1)) {
          ascending = diff === 1;
          runLen++;
        } else if (ascending === true && diff === 1) {
          runLen++;
        } else if (ascending === false && diff === -1) {
          runLen++;
        } else {
          break;
        }
      }

      if (runLen >= 3 && runLen > bestLen) {
        bestLen = runLen;
        bestRun = lower.substring(i, i + runLen);
      }
    }

    return bestLen >= 3 ? { length: bestLen, sample: bestRun } : null;
  }

  /**
   * Checks whether the password contains a substring (length >= 4)
   * that matches part of a keyboard row, forwards or backwards.
   */
  function findKeyboardPattern(password) {
    const lower = password.toLowerCase();
    const minLen = 4;

    for (let len = Math.min(lower.length, 8); len >= minLen; len--) {
      for (let i = 0; i + len <= lower.length; i++) {
        const chunk = lower.substring(i, i + len);
        const chunkRev = reverse(chunk);

        for (const row of KEYBOARD_ROWS) {
          if (row.includes(chunk) || row.includes(chunkRev)) {
            return { length: len, sample: chunk };
          }
        }
      }
    }
    return null;
  }

  /**
   * Detects 3 or more of the same character in a row, e.g. "aaaa", "111".
   */
  function findRepeatedCharacters(password) {
    let bestLen = 0;
    let bestChar = "";
    let current = 1;

    for (let i = 1; i <= password.length; i++) {
      if (i < password.length && password[i] === password[i - 1]) {
        current++;
      } else {
        if (current > bestLen) {
          bestLen = current;
          bestChar = password[i - 1];
        }
        current = 1;
      }
    }

    return bestLen >= 3 ? { length: bestLen, char: bestChar } : null;
  }

  /**
   * Detects a short substring (1-4 chars) that repeats 3+ times and
   * covers most of the password, e.g. "abcabcabc", "hihihihi".
   */
  function findRepeatedBlock(password) {
    const n = password.length;
    for (let blockLen = 1; blockLen <= 4; blockLen++) {
      if (n < blockLen * 3) continue;
      const block = password.substring(0, blockLen);
      let repeats = 1;
      let pos = blockLen;
      while (password.substring(pos, pos + blockLen) === block) {
        repeats++;
        pos += blockLen;
      }
      const covered = repeats * blockLen;
      if (repeats >= 3 && covered >= n * 0.8) {
        return { block, repeats };
      }
    }
    return null;
  }

  /**
   * Detects a "word followed by a short number / year" structure,
   * e.g. "football123", "dragon2026". Does not attempt to identify
   * names or personal data - purely structural.
   */
  function findWordPlusNumber(password) {
    const match = password.match(/^([A-Za-z]{3,})(\d{1,4})$/);
    if (!match) return null;

    const [, word, digits] = match;
    const looksLikeYear = /^(19|20)\d{2}$/.test(digits);

    return { word, digits, looksLikeYear };
  }

  /**
   * Checks whether the (case-insensitive) password matches an entry
   * in the given list exactly.
   */
  function isInList(password, list) {
    const lower = password.toLowerCase();
    return list.includes(lower);
  }

  /**
   * Checks whether the password, after stripping trailing digits,
   * matches a dictionary word - e.g. "dragon2026" -> "dragon".
   */
  function matchesWordWithSuffixStripped(password, wordList) {
    const stripped = password.toLowerCase().replace(/\d+$/, "");
    if (stripped.length < 3) return null;
    return wordList.includes(stripped) ? stripped : null;
  }

  return {
    normalizeLeet,
    findSequentialRun,
    findKeyboardPattern,
    findRepeatedCharacters,
    findRepeatedBlock,
    findWordPlusNumber,
    isInList,
    matchesWordWithSuffixStripped
  };
})();
