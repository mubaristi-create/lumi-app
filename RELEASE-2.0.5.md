# Lumi 2.0.5 (22) — Puzzle content and verified rewards

## Delivered
- Sudoku now uses explicit between-move ad checkpoints in long games (minimum 90 seconds and 12 completed inputs, shared native cooldown). The board is paused and resumes unchanged. Completed digits (nine copies on the board) dim and disable in the number pad.
- EYO expands to 2,000 validated connected crossword levels: 8,000 unique target words and 1,428 additional unique hidden words. No target/hidden word occurs in two levels of this new pack. First 44 packs use the previous curated vocabulary; unused letters were removed and the remaining packs progress by letter-set size. Existing active runs retain their original snapshots. Per-word LUMI rewards remain unchanged.
- The wider dictionary was approved by the owner: Mozilla Azerbaijan Hunspell, MPL-2.0. Attribution, original dictionary and license are retained. Words are dictionary-backed; the entire expanded vocabulary has not been independently reviewed by a human editor.
- Tiles expands to 400 solver-validated levels in ten worlds. The iframe starts on a matching background and fades in after load. Board sizing no longer feeds its content size back into the flex region; resize measurements are debounced and native background transforms are disabled.
- Tiles daily login rewards: 25, 50, 75, 100, 125, 150 and 175 LUMI. One credit per Baku calendar day; consecutive days advance, a missed day resets, day eight starts a new cycle. The first daily login claims automatically. The daily panel shows the claimed state.
- Daily Tiles tasks: ten pairs (+25), one completed level (+50), three distinct completed levels (+75). Weekly task: ten distinct completed levels (+150). Progress is derived from server-validated runs; claims are owner-checked and idempotent.
- Exhausted Tiles hint/shuffle/undo controls offer an optional rewarded ad for that exact help type. Receipts are run-scoped, validated by Google SSV, and cannot be reused.
- EYO gameplay has a direct +100 game-coin rewarded button; the existing shop reward remains available. The existing server cooldown applies. Ad coins are separate from LUMI.

## Reward root cause and recovery
Actual Google callbacks supplied the numeric unit `4384179040`, while the server compared only the full `ca-app-pub-3669039231023564/4384179040`. The private SSV completion function now accepts an exact suffix match to the full enabled unit already bound to that request. Google ECDSA signatures, request owner, transaction uniqueness and expiry checks remain mandatory.
Six authentic signed callbacks previously rejected by this mismatch were replayed through the original verification endpoint and returned HTTP 200. Requests without usable verified evidence were not credited.
Played receipts persist until the game acknowledges the benefit. Delayed SSV retries recover the same receipt without showing another ad. Native background events during an active ad no longer open the common settings overlay over the resumed game.

## Verification
- 422 database/content assertions: daily claims/replay/ACL, tasks, all 2,000 SQL-validated EYO layouts, global word uniqueness, all 400 Tiles solutions, three help placements, signed short-unit compatibility and denied unsigned access.
- Sudoku UI/recovery, shared ad cooldown/banner, delayed SSV, Tiles wallet/recovery and iframe CSP regressions passed.
- Browser checks covered Tiles at 360×640 and 320×550 (no document overflow; help controls in bounds), depleted-help dialog, EYO fresh start with five letters and +100 coin button, and a disabled completed Sudoku digit.
- Live server contains 2,000 EYO levels and 400 Tiles levels. No email-confirmation setting changed.
- Signed AAB and bundle integrity are checked before delivery. This release is not automatically uploaded to Play Console.

Physical Android/iOS rendering and live AdMob fill still require an installed-device check. AdMob currently shows limited serving pending store review/linking; this code does not override provider availability. The web version does not simulate native ads or grant unverified ad rewards.
