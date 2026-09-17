/**
 * app.js
 * UI layer.
 *
 * Security:
 * - Passwords remain in browser memory only.
 * - Passwords are never logged.
 * - Passwords are never persisted.
 * - Passwords are never placed in the URL.
 * - Passwords are never sent to a server.
 */

(function () {
  "use strict";

  // =========================================================
  // FALLBACK DATASETS
  // =========================================================

  const FALLBACK_COMMON_PASSWORDS = [
    "123456",
    "password",
    "12345678",
    "qwerty",
    "123456789",
    "12345",
    "111111",
    "abc123",
    "football",
    "monkey",
    "letmein",
    "welcome",
    "password123",
    "admin",
    "iloveyou",
    "qwerty123",
    "passw0rd",
    "p@ssword"
  ];

  const FALLBACK_COMMON_WORDS = [
    "football",
    "computer",
    "dragon",
    "monkey",
    "sunshine",
    "princess",
    "baseball",
    "soccer",
    "welcome",
    "freedom",
    "master",
    "shadow"
  ];

  let datasets = {
    commonPasswords: FALLBACK_COMMON_PASSWORDS,
    commonWords: FALLBACK_COMMON_WORDS
  };

  // =========================================================
  // LOAD DATASETS
  // =========================================================

  async function loadDatasets() {
    try {
      const [pwRes, wordRes] = await Promise.all([
        fetch("data/common-passwords.json"),
        fetch("data/common-words.json")
      ]);

      if (!pwRes.ok || !wordRes.ok) {
        throw new Error("Dataset request failed");
      }

      const [pwData, wordData] = await Promise.all([
        pwRes.json(),
        wordRes.json()
      ]);

      if (!Array.isArray(pwData) || !Array.isArray(wordData)) {
        throw new Error("Invalid dataset format");
      }

      datasets = {
        commonPasswords: pwData.map((password) =>
          String(password).toLowerCase()
        ),

        commonWords: wordData.map((word) =>
          String(word).toLowerCase()
        )
      };
    } catch (_) {
      datasets = {
        commonPasswords: FALLBACK_COMMON_PASSWORDS,
        commonWords: FALLBACK_COMMON_WORDS
      };
    }
  }

  // =========================================================
  // DOM ELEMENTS
  // =========================================================

  const input = document.getElementById("password-input");
  const toggleBtn = document.getElementById("toggle-visibility");
  const clearBtn = document.getElementById("clear-btn");

  const strengthLabel =
    document.getElementById("strength-label");

  const scoreValue =
    document.getElementById("score-value");

  const scoreRing =
    document.getElementById("score-ring");

  const analysisPlaceholder =
    document.getElementById("analysis-placeholder");

  const analysisContent =
    document.getElementById("analysis-content");

  const securityTable =
    document.getElementById("security-table");

  const weaknessSummary =
    document.getElementById("weakness-summary");

  const lengthFeedback =
    document.getElementById("length-feedback");

  const lengthCount =
    document.getElementById("length-count");

  const charList =
    document.getElementById("char-analysis-list");

  const weaknessList =
    document.getElementById("weakness-list");

  const noWeaknessMsg =
    document.getElementById("no-weakness-msg");

  const entropyRaw =
    document.getElementById("entropy-raw");

  const entropyGuessability =
    document.getElementById("entropy-guessability");

  const recommendationList =
    document.getElementById("recommendation-list");

  // =========================================================
  // STRENGTH COLORS
  // =========================================================

  /*
   * These colors are also used by the score ring.
   *
   * VERY WEAK  -> red
   * WEAK       -> red
   * FAIR       -> amber
   * STRONG     -> green
   * VERY STRONG-> green
   */

  const STRENGTH_COLORS = {
    "VERY WEAK": "#ff5b66",
    "WEAK": "#ff5b66",
    "FAIR": "#ffb23e",
    "MODERATE": "#ffb23e",
    "STRONG": "#2ce0a1",
    "VERY STRONG": "#2ce0a1"
  };

  // =========================================================
  // HELPER
  // =========================================================

  function appendListItems(list, items) {
    if (!list) return;

    list.replaceChildren();

    items.forEach((text) => {
      const li = document.createElement("li");

      /*
       * textContent is intentionally used instead of innerHTML.
       * This prevents analyzed data from being interpreted as HTML.
       */

      li.textContent = text;

      list.appendChild(li);
    });
  }

  // =========================================================
  // RENDER ANALYSIS
  // =========================================================

  function render(result) {
    if (!result || !result.lengthInfo) {
      return;
    }

    const hasPassword =
      result.lengthInfo.category !== "empty";

    if (analysisPlaceholder) {
      analysisPlaceholder.hidden = hasPassword;
    }

    if (analysisContent) {
      analysisContent.hidden = !hasPassword;
    }

    // =======================================================
    // EMPTY STATE
    // =======================================================

    if (!hasPassword) {
      if (scoreValue) {
        scoreValue.textContent = "0";
      }

      if (strengthLabel) {
        strengthLabel.textContent = "—";

        /*
         * Remove the data attribute so CSS does not keep
         * the previous password's status color.
         */

        strengthLabel.removeAttribute("data-strength");

        strengthLabel.style.backgroundColor = "";
        strengthLabel.style.color = "";
        strengthLabel.style.borderColor = "";
        strengthLabel.style.boxShadow = "";
      }

      if (scoreRing) {
        scoreRing.style.setProperty("--score", "0");
        scoreRing.style.setProperty(
          "--ring-color",
          "#1b3552"
        );
      }

      if (securityTable) {
        securityTable.replaceChildren();
      }

      if (charList) {
        charList.replaceChildren();
      }

      if (weaknessList) {
        weaknessList.replaceChildren();
      }

      if (recommendationList) {
        recommendationList.replaceChildren();
      }

      if (noWeaknessMsg) {
        noWeaknessMsg.hidden = true;
      }

      if (weaknessSummary) {
        weaknessSummary.textContent =
          "Enter a password to begin analysis.";
      }

      if (entropyRaw) {
        entropyRaw.textContent = "0 bits";
      }

      if (entropyGuessability) {
        entropyGuessability.textContent = "—";
      }

      return;
    }

    // =======================================================
    // SCORE + STRENGTH
    // =======================================================

    const strengthLevel =
      String(result.strength.level || "")
        .toUpperCase();

    const strengthColor =
      STRENGTH_COLORS[strengthLevel] ||
      "#2ce0a1";

    if (strengthLabel) {
      strengthLabel.textContent =
        strengthLevel;

      /*
       * IMPORTANT:
       *
       * This attribute allows style.css to apply the correct
       * red / amber / green styling.
       *
       * Example:
       * data-strength="VERY WEAK"
       */

      strengthLabel.setAttribute(
        "data-strength",
        strengthLevel
      );

      /*
       * The CSS contains !important status rules, so these
       * values will not override the status-specific styling.
       * They provide a safe fallback.
       */

      strengthLabel.style.color =
        strengthColor;
    }

    if (scoreRing) {
      scoreRing.style.setProperty(
        "--score",
        result.strength.score
      );

      scoreRing.style.setProperty(
        "--ring-color",
        strengthColor
      );
    }

    if (scoreValue) {
      scoreValue.textContent =
        String(result.strength.score);
    }

    // =======================================================
    // LENGTH
    // =======================================================

    if (lengthFeedback) {
      lengthFeedback.textContent =
        result.lengthInfo.feedback;
    }

    if (lengthCount) {
      const length =
        result.lengthInfo.len;

      lengthCount.textContent =
        `${length} character${
          length === 1 ? "" : "s"
        }`;
    }

    // =======================================================
    // CHARACTER ANALYSIS
    // =======================================================

    if (charList) {
      const chars = result.charTypes;

      const charItems = [
        [
          "Lowercase letters",
          chars.lowercase
        ],
        [
          "Uppercase letters",
          chars.uppercase
        ],
        [
          "Numbers",
          chars.digits
        ],
        [
          "Special characters",
          chars.symbols
        ],
        [
          "Spaces",
          chars.spaces
        ]
      ];

      charList.replaceChildren();

      charItems.forEach(
        ([label, present]) => {
          const item =
            document.createElement("li");

          item.className =
            present
              ? "present"
              : "missing";

          item.textContent =
            `${present ? "✓" : "✗"} ${label}`;

          charList.appendChild(item);
        }
      );
    }

    // =======================================================
    // SECURITY ANALYSIS
    // =======================================================

    if (securityTable) {
      const hasSequence =
        Array.isArray(result.patternFindings) &&
        result.patternFindings.some(
          (finding) =>
            finding.type === "sequence"
        );

      const checks = [
        [
          "Password Length",
          result.lengthInfo.feedback,
          `${result.lengthInfo.len} characters`
        ],

        [
          "Common Password",
          result.isCommon
            ? "Detected"
            : "Not detected",
          ""
        ],

        [
          "Dictionary Pattern",
          result.dictionaryMatch
            ? "Detected"
            : "Not detected",
          ""
        ],

        [
          "Sequential Pattern",
          hasSequence
            ? "Detected"
            : "Not detected",
          ""
        ],

        [
          "Repetition",
          result.repetitionFinding
            ? "Detected"
            : "Not detected",
          ""
        ]
      ];

      securityTable.replaceChildren();

      checks.forEach(
        ([label, status, value]) => {
          const row =
            document.createElement("div");

          row.className =
            "security-row";

          // Status icon
          const icon =
            document.createElement("span");

          icon.className =
            "check";

          const detected =
            status === "Detected";

          icon.textContent =
            detected ? "!" : "✓";

          if (detected) {
            icon.style.background =
              "rgba(255,91,102,.12)";

            icon.style.color =
              "#ff5b66";
          }

          // Check name
          const name =
            document.createElement("span");

          name.textContent =
            label;

          // Status
          const resultText =
            document.createElement("span");

          resultText.className =
            "security-status";

          resultText.textContent =
            status;

          if (detected) {
            resultText.style.color =
              "#ff5b66";
          }

          // Value
          const valueText =
            document.createElement("span");

          valueText.className =
            "security-value";

          valueText.textContent =
            value;

          row.append(
            icon,
            name,
            resultText,
            valueText
          );

          securityTable.appendChild(row);
        }
      );
    }

    // =======================================================
    // WEAKNESSES
    // =======================================================

    const weaknesses = [];

    if (result.isCommon) {
      weaknesses.push(
        "This password is commonly used and may be easy to guess."
      );
    }

    if (result.leetMatch) {
      weaknesses.push(
        "This password uses simple substitutions that still resemble a common password."
      );
    }

    if (result.dictionaryMatch) {
      weaknesses.push(
        "This password is based on a common dictionary word."
      );
    }

    if (Array.isArray(result.patternFindings)) {
      result.patternFindings.forEach(
        (finding) => {
          if (finding && finding.message) {
            weaknesses.push(
              finding.message
            );
          }
        }
      );
    }

    if (
      result.repetitionFinding &&
      Array.isArray(result.patternFindings) &&
      !result.patternFindings.some(
        (finding) =>
          finding.type === "repeated-block"
      )
    ) {
      weaknesses.push(
        result.repetitionFinding.message
      );
    }

    if (
      result.lengthInfo.category ===
        "very-short" ||
      result.lengthInfo.category ===
        "short"
    ) {
      weaknesses.push(
        "Password length is short and should be increased."
      );
    }

    /*
     * Remove duplicate weakness messages.
     */

    const uniqueWeaknesses =
      [...new Set(weaknesses)];

    appendListItems(
      weaknessList,
      uniqueWeaknesses
    );

    if (noWeaknessMsg) {
      noWeaknessMsg.hidden =
        uniqueWeaknesses.length !== 0;
    }

    if (weaknessSummary) {
      weaknessSummary.textContent =
        uniqueWeaknesses.length
          ? `${uniqueWeaknesses.length} security issue${
              uniqueWeaknesses.length === 1
                ? ""
                : "s"
            } detected.`
          : "No security issues detected.";
    }

    // =======================================================
    // ENTROPY
    // =======================================================

    if (entropyRaw && result.entropy) {
      entropyRaw.textContent =
        `${result.entropy.rawBits} bits`;
    }

    if (
      entropyGuessability &&
      result.entropy
    ) {
      entropyGuessability.textContent =
        result.entropy.guessability;
    }

    // =======================================================
    // RECOMMENDATIONS
    // =======================================================

    if (
      recommendationList &&
      typeof Recommendations !== "undefined" &&
      typeof Recommendations.generateRecommendations ===
        "function"
    ) {
      appendListItems(
        recommendationList,
        Recommendations.generateRecommendations(
          result
        )
      );
    }
  }

  // =========================================================
  // RUN ANALYSIS
  // =========================================================

  function runAnalysis() {
    if (!input) {
      return;
    }

    /*
     * The password is read directly from the input and passed
     * to the analyzer.
     *
     * It is not:
     * - logged
     * - stored
     * - sent to a server
     * - placed in the URL
     * - written to localStorage
     * - written to sessionStorage
     */

    const password =
      input.value;

    if (
      typeof Analyzer === "undefined" ||
      typeof Analyzer.analyzePassword !==
        "function"
    ) {
      return;
    }

    const result =
      Analyzer.analyzePassword(
        password,
        datasets
      );

    render(result);
  }

  // =========================================================
  // PASSWORD INPUT
  // =========================================================

  if (input) {
    input.addEventListener(
      "input",
      runAnalysis
    );
  }

  // =========================================================
  // SHOW / HIDE PASSWORD
  // =========================================================

  if (toggleBtn && input) {
    toggleBtn.addEventListener(
      "click",
      () => {
        const showing =
          input.type === "text";

        input.type =
          showing
            ? "password"
            : "text";

        toggleBtn.textContent =
          showing
            ? "◉"
            : "🙈";

        toggleBtn.setAttribute(
          "aria-label",
          showing
            ? "Show password"
            : "Hide password"
        );
      }
    );
  }

  // =========================================================
  // CLEAR PASSWORD
  // =========================================================

  if (clearBtn && input) {
    clearBtn.addEventListener(
      "click",
      () => {
        input.value = "";

        input.focus();

        runAnalysis();
      }
    );
  }

  // =========================================================
  // PASSWORD GENERATOR ELEMENTS
  // =========================================================

  const genLengthInput =
    document.getElementById(
      "gen-length"
    );

  const genLengthValue =
    document.getElementById(
      "gen-length-value"
    );

  const generateBtn =
    document.getElementById(
      "generate-btn"
    );

  const generatedOutput =
    document.getElementById(
      "generated-output"
    );

  const generatedPasswordEl =
    document.getElementById(
      "generated-password"
    );

  const copyBtn =
    document.getElementById(
      "copy-generated"
    );

  // =========================================================
  // GENERATOR CHARACTER SET
  // =========================================================

  const GEN_CHARSET =
    "abcdefghijklmnopqrstuvwxyz" +
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
    "0123456789" +
    "!@#$%^&*()-_=+[]{}";

  // =========================================================
  // GENERATOR LENGTH DISPLAY
  // =========================================================

  if (
    genLengthInput &&
    genLengthValue
  ) {
    genLengthInput.addEventListener(
      "input",
      () => {
        genLengthValue.textContent =
          genLengthInput.value;
      }
    );
  }

  // =========================================================
  // SECURE PASSWORD GENERATION
  // =========================================================

  /*
   * Rejection sampling avoids the small modulo bias that
   * can occur when random values are directly reduced using
   * value % charset.length.
   */

  function generateSecurePassword(length) {
    if (
      !Number.isInteger(length) ||
      length < 8 ||
      length > 64
    ) {
      throw new Error(
        "Invalid password length"
      );
    }

    if (
      typeof crypto === "undefined" ||
      typeof crypto.getRandomValues !==
        "function"
    ) {
      throw new Error(
        "Web Crypto API unavailable"
      );
    }

    const maxUint32 =
      0x100000000;

    const limit =
      maxUint32 -
      (
        maxUint32 %
        GEN_CHARSET.length
      );

    let output = "";

    while (
      output.length < length
    ) {
      const remaining =
        length - output.length;

      const values =
        new Uint32Array(
          Math.max(16, remaining)
        );

      crypto.getRandomValues(
        values
      );

      for (
        const value of values
      ) {
        if (value >= limit) {
          continue;
        }

        output +=
          GEN_CHARSET[
            value %
            GEN_CHARSET.length
          ];

        if (
          output.length === length
        ) {
          break;
        }
      }
    }

    return output;
  }

  // =========================================================
  // GENERATE BUTTON
  // =========================================================

  if (
    generateBtn &&
    genLengthInput &&
    generatedOutput &&
    generatedPasswordEl
  ) {
    generateBtn.addEventListener(
      "click",
      () => {
        try {
          const length =
            parseInt(
              genLengthInput.value,
              10
            );

          const generated =
            generateSecurePassword(
              length
            );

          generatedPasswordEl.textContent =
            generated;

          generatedOutput.hidden =
            false;

        } catch (_) {
          generatedOutput.hidden =
            true;
        }
      }
    );
  }

  // =========================================================
  // COPY GENERATED PASSWORD
  // =========================================================

  if (
    copyBtn &&
    generatedPasswordEl
  ) {
    copyBtn.addEventListener(
      "click",
      async () => {
        const text =
          generatedPasswordEl.textContent;

        if (!text) {
          return;
        }

        try {
          await navigator.clipboard.writeText(
            text
          );

          copyBtn.textContent =
            "✓";

          setTimeout(
            () => {
              copyBtn.textContent =
                "▣";
            },
            1200
          );

        } catch (_) {
          /*
           * Clipboard access may be unavailable
           * in some browser/local-server contexts.
           */
        }
      }
    );
  }

  // =========================================================
  // INFORMATION OVERLAYS
  // =========================================================

  const infoOverlays =
    document.querySelectorAll(
      ".info-overlay"
    );

  const closeInfoButtons =
    document.querySelectorAll(
      "[data-close-info]"
    );

  function closeInfoPanels() {
    infoOverlays.forEach(
      (panel) => {
        panel.hidden = true;
      }
    );

    document.body.style.overflow =
      "";
  }

  function openInfoPanel(id) {
    closeInfoPanels();

    const panel =
      document.getElementById(id);

    if (!panel) {
      return;
    }

    panel.hidden = false;

    document.body.style.overflow =
      "hidden";
  }

  // =========================================================
  // SCROLL TO SECTION
  // =========================================================

  function scrollToSection(id) {
    const section =
      document.getElementById(id);

    if (!section) {
      return;
    }

    closeInfoPanels();

    section.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  // =========================================================
  // SIDEBAR NAVIGATION
  // =========================================================

  document
    .querySelectorAll(".side-link")
    .forEach((link) => {
      link.addEventListener(
        "click",
        (event) => {
          const href =
            link.getAttribute("href");

          if (
            !href ||
            !href.startsWith("#")
          ) {
            return;
          }

          event.preventDefault();

          const id =
            href.substring(1);

          if (
            id === "security-tips" ||
            id === "about"
          ) {
            openInfoPanel(id);

            history.replaceState(
              null,
              "",
              `#${id}`
            );
          } else {
            scrollToSection(id);

            history.replaceState(
              null,
              "",
              `#${id}`
            );
          }

          document
            .querySelectorAll(
              ".side-link"
            )
            .forEach((item) => {
              item.classList.toggle(
                "active",
                item === link
              );
            });
        }
      );
    });

  // =========================================================
  // TOP NAVIGATION
  // =========================================================

  document
    .querySelectorAll(".top-nav a")
    .forEach((link) => {
      link.addEventListener(
        "click",
        (event) => {
          const href =
            link.getAttribute("href");

          if (
            !href ||
            !href.startsWith("#")
          ) {
            return;
          }

          event.preventDefault();

          const id =
            href.substring(1);

          if (
            id === "security-tips" ||
            id === "about"
          ) {
            openInfoPanel(id);

            history.replaceState(
              null,
              "",
              `#${id}`
            );
          } else {
            scrollToSection(id);

            history.replaceState(
              null,
              "",
              `#${id}`
            );
          }

          document
            .querySelectorAll(
              ".top-nav a"
            )
            .forEach((item) => {
              item.classList.toggle(
                "active",
                item === link
              );
            });
        }
      );
    });

  // =========================================================
  // CLOSE INFORMATION PANELS
  // =========================================================

  closeInfoButtons.forEach(
    (button) => {
      button.addEventListener(
        "click",
        () => {
          closeInfoPanels();

          history.replaceState(
            null,
            "",
            "#analyzer"
          );
        }
      );
    }
  );

  // =========================================================
  // CLICK OUTSIDE INFORMATION PANEL
  // =========================================================

  infoOverlays.forEach(
    (overlay) => {
      overlay.addEventListener(
        "click",
        (event) => {
          if (
            event.target ===
            overlay
          ) {
            closeInfoPanels();

            history.replaceState(
              null,
              "",
              "#analyzer"
            );
          }
        }
      );
    }
  );

  // =========================================================
  // ESCAPE KEY
  // =========================================================

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Escape"
      ) {
        closeInfoPanels();

        history.replaceState(
          null,
          "",
          "#analyzer"
        );
      }
    }
  );

  // =========================================================
  // HANDLE INITIAL URL HASH
  // =========================================================

  function handleInitialHash() {
    const id =
      window.location.hash.substring(1);

    if (
      id === "security-tips" ||
      id === "about"
    ) {
      openInfoPanel(id);
    }
  }

  // =========================================================
  // INITIALIZE APPLICATION
  // =========================================================

  loadDatasets()
    .then(() => {
      runAnalysis();
      handleInitialHash();
    })
    .catch(() => {
      /*
       * The fallback datasets are already available,
       * so the application can still analyze passwords.
       */

      runAnalysis();
      handleInitialHash();
    });

})();