# Manual Test Cases

Run these tests after each major change. The expected result describes the security signal, not a guaranteed exact score.

| # | Input | Expected signal |
|---|---|---|
| 1 | *(empty)* | No analysis sections shown. |
| 2 | `1` | Very short. |
| 3 | `123456` | Common + short + sequential. |
| 4 | `password` | Common + dictionary. |
| 5 | `password123` | Common/predictable + word-number structure. |
| 6 | `P@ssword123` | Leetspeak/common-password disguise + predictable suffix. |
| 7 | `qwerty123` | Keyboard pattern + predictable suffix. |
| 8 | `aaaaaaaaaaaaaaaa` | Repetition; should not receive a high score merely because it is long. |
| 9 | `abcabcabc` | Repeated block. |
| 10 | `football2026` | Dictionary + word-year structure. |
| 11 | `correct horse battery staple friend` | Long passphrase; no requirement for symbols. |
| 12 | A long random password | Should generally score higher than predictable passwords of similar length. |
| 13 | Only letters | Character diversity warning is not used as the main strength decision. |
| 14 | Only numbers | Short numeric sequences should be detected when applicable. |
| 15 | Symbols only | Valid input; strength depends on length/predictability, not symbols alone. |
| 16 | Password containing spaces | Spaces are accepted and analyzed. |
| 17 | Very long password | UI remains usable; no artificial small maximum in the analyzer. |
| 18 | `<script>alert(1)</script>` | Must be rendered as text, never interpreted as HTML. |

## Security checks

- Confirm no password is printed with `console.log()`.
- Confirm no password is stored in localStorage/sessionStorage/cookies.
- Confirm no password is placed in a URL.
- Confirm no external API receives the password.
- Use browser DevTools Network tab to verify the analyzer itself makes no password-bearing requests.
- Confirm the result UI safely handles special characters such as `<`, `>`, `&`, and quotes.
