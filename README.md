# Password Strength Analyzer

## 1. Project Overview

A client-side cybersecurity tool that analyzes a password's strength and
predictability, and explains *why* it received the rating it did — rather
than just checking whether it contains uppercase letters, lowercase
letters, numbers, and symbols.

This is a cybersecurity project first, and a password generator second.
The generator on the page is a small, optional convenience feature.

## 2. Objective

Character-type checklists ("has uppercase? has a number?") are a weak way
to judge password strength, because a password like `P@ssword123!` passes
every checklist item while still being one of the first guesses an
attacker would try. This project instead evaluates length, character
composition, known common passwords, dictionary words, and structural
patterns (sequences, keyboard walks, repetition, word+year combinations)
together, and produces a heuristic strength estimate along with specific,
relevant recommendations.

## 3. Features

- Real-time analysis as you type (debounced only by the browser's own
  input event — no artificial delay)
- Show/hide and clear controls for the password field
- Six-level length classification
- Five-flag character composition breakdown (lower/upper/digit/symbol/space)
- Common-password detection against an expandable JSON list
- Dictionary-word detection, including simple `word + digits` suffixes
- Leetspeak/substitution detection (e.g. `P@ssw0rd` → `password`)
- Predictable-pattern detection: sequential runs, keyboard-row walks,
  repeated character runs, repeated blocks, and word+year/number structures
- A 0–100 heuristic strength score and VERY WEAK → VERY STRONG label
- A theoretical character-set entropy estimate plus a separate heuristic
  guessability assessment
- Context-specific recommendations generated only from weaknesses
  actually found in the entered password
- An optional, secondary cryptographically-random password generator
- No network calls, no storage, no logging of the password at any point

## 4. Technologies Used

- HTML5, CSS3, vanilla JavaScript (no frameworks, no build step)
- Local JSON data files for common passwords / common words
- `crypto.getRandomValues()` for the optional generator

## 5. Architecture

```
index.html        → structure/markup only
css/style.css      → all styling
js/patterns.js     → low-level pattern-detection helpers (pure functions)
js/analyzer.js     → combines checks into a single analysis + scoring engine
js/recommendations.js → turns an analysis result into a tip list
js/app.js          → DOM wiring: reads input, calls Analyzer, renders output
data/*.json        → expandable common-password / common-word lists
```

Analysis logic (`analyzer.js`, `patterns.js`, `recommendations.js`) is
completely separate from UI logic (`app.js`), so the checks themselves
could be reused in a CLI tool or test suite without any DOM code.

## 6. How Password Analysis Works

For every keystroke, `Analyzer.analyzePassword()` runs each check below
against the current password string held only in a local JS variable,
and returns a single results object that `app.js` renders:

1. `checkLength` — classifies length into 6 categories (empty → very long)
2. `checkCharacterTypes` — flags lower/upper/digit/symbol/space presence
3. `checkCommonPassword` — exact match against `data/common-passwords.json`
4. `checkLeetSubstitution` — normalizes common substitutions (`@`→`a`,
   `0`→`o`, `3`→`e`, `1`/`!`→`i`, `$`/`5`→`s`, `7`→`t`, `+`→`t`) and
   re-checks against the common-password list
5. `checkDictionaryWords` — exact and suffix-stripped match against
   `data/common-words.json`
6. `checkPatterns` — sequential runs, keyboard-row walks, repeated
   blocks, and word+number/year structures
7. `checkRepetition` — 3+ identical characters in a row
8. `calculateStrength` — combines all of the above into a score/level
9. `estimateEntropy` — a simplified bits-of-entropy estimate

## 7. Password Security Concepts (for the write-up / viva)

- **Password strength** — how resistant a password is to being guessed
  or computed by an attacker, considering both randomness and length.
- **Password length** — each additional character multiplies the number
  of possible passwords an attacker must try; it is one of the single
  biggest levers for strength.
- **Password unpredictability** — whether a password follows a pattern
  a human or algorithm could anticipate (dictionary words, keyboard
  walks, dates), independent of raw length or character variety.
- **Entropy** — a measure, in bits, of how many attempts (on average)
  it would take to guess a value drawn from a given distribution.
  Higher entropy means more possible values need to be tried.
- **Brute-force attacks** — systematically trying every possible
  combination of characters until the correct password is found.
- **Dictionary attacks** — trying words from a dictionary (and common
  variations of them) instead of random characters, since real
  passwords are rarely truly random.
- **Credential stuffing** — reusing passwords leaked from one breached
  service to try to log into other, unrelated services — this is why
  "use a unique password per account" is a core recommendation here.
- **Common password detection** — checking a password against known
  lists of frequently used or previously breached passwords, which
  attackers try first because they are disproportionately effective.
- **Password hashing** — storing a one-way mathematical transformation
  of a password (instead of the password itself) so that even a
  database breach doesn't directly expose user passwords.
- **Salt** — random data added to a password before hashing, unique
  per user, so that identical passwords don't produce identical hashes
  and so that precomputed lookup tables (rainbow tables) become
  ineffective.
- **Hashing vs. encryption** — hashing is one-way and not meant to be
  reversed (used for verifying passwords); encryption is two-way and
  meant to be decrypted back to the original data with a key. Passwords
  should be hashed, never merely encrypted, for storage.

## 8. Entropy Explanation (as implemented here)

This project calculates a **theoretical character-set estimate** as:

```
entropy_bits = password_length × log2(character_pool_size)
```

where `character_pool_size` is estimated from the character categories
present. This assumes the password was generated uniformly and independently
from that pool. Human-chosen passwords often do not meet that assumption, so
the value is explicitly presented as a theoretical estimate rather than as
measured password entropy.

The UI separately reports a **heuristic guessability assessment** when common
passwords, dictionary words, or predictable structures are detected. It does
not invent a second numerical entropy value from arbitrary penalties.

For a more realistic password-guessing model, a mature estimator such as
`zxcvbn` would be more appropriate; this project intentionally keeps its
built-in analysis simple and transparent for educational purposes.

## 9. Security / Privacy Considerations

- The password is analyzed entirely client-side; it is never sent to a
  server or any external API.
- The password is never written to `localStorage`, `sessionStorage`,
  cookies, or a URL.
- The password is never passed to `console.log()` or any other logging
  mechanism.
- The password exists only in the input field's DOM value and in local
  JavaScript variables for the duration of analysis.
- The generated (secondary) password feature uses
  `crypto.getRandomValues()`, the cryptographically secure randomness
  source, rather than `Math.random()`, and is likewise never stored or
  transmitted.

## 10. Project Structure

```
password-strength-analyzer/
│
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── analyzer.js
│   ├── patterns.js
│   └── recommendations.js
├── data/
│   ├── common-passwords.json
│   └── common-words.json
├── tests/
│   └── test-cases.md
├── screenshots/
└── README.md
```

## 11. How to Run

**Option A — double-click `index.html`.**
The app works immediately. If your browser blocks `fetch()` for local
files (common on `file://` URLs), the app automatically falls back to a
small built-in dataset embedded in `app.js`, so all features still work.

**Option B — run a local server (recommended, enables the full JSON datasets):**

```bash
cd password-strength-analyzer
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## 12. Test Cases

See [`tests/test-cases.md`](tests/test-cases.md) for 18 manual test cases
covering empty input, common passwords, dictionary words, every pattern
type, repetition, long passphrases, and long random passwords, along with
what each one should demonstrate about the analyzer.

## 13. Limitations

- This is a heuristic, educational tool — the strength score is an
  estimate, not a guarantee that any password is actually secure.
- The common-password and common-word lists are small samples for
  demonstration purposes, not comprehensive breach-data lists.
- Pattern detection covers common cases (sequences, keyboard rows,
  repetition, simple substitutions, word+number structures) but cannot
  catch every possible predictable structure a human might choose.
- Entropy is estimated from character-pool size and simple pattern
  penalties, not modeled from real-world password-guessing data the way
  a tool like `zxcvbn` does.
- No backend means the common-password/word lists can't be updated
  without shipping a new file to the client.

## 14. Future Improvements

- Expand the common-password and dictionary-word lists using larger,
  properly licensed breach-data corpora.
- Integrate a library such as `zxcvbn` for more realistic guessability
  scoring, clearly explained to the user as an enhancement over the
  built-in heuristic.
- Add localization/internationalization for non-English dictionary
  words and keyboard layouts (e.g. AZERTY, QWERTZ).
- Add automated unit tests (e.g. with a lightweight test runner) that
  execute the manual cases in `tests/test-cases.md` automatically.
- Optionally add a haveibeenpwned-style **k-anonymity** breach check
  (only the first 5 characters of a SHA-1 hash are sent, never the
  password itself) as an explicitly-labeled, opt-in feature.
