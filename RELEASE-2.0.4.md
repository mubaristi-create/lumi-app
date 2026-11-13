# Lumi 2.0.4 (21) — Sudoku and long-session puzzle ads

- Added the prepared Lumi Sudoku module to the home game carousel and Android bundle: 150 uniquely solvable puzzles across Easy/Medium/Hard, notes, undo, three hints, pause, sound controls and saved authenticated progress.
- Server owns the board and validates every move. Completion rewards are 160/200/240 LUMI, awarded once per puzzle and capped by the 10,000 daily earning ceiling. No client-supplied reward or solution is accepted. Four private RLS-enabled tables, authenticated owner-checked RPCs and rate guards.
- Fixed native banner slot also applies to Sudoku. Wins/losses use the shared full-screen cooldown; one revive requires a verified Google SSV receipt scoped to that run.
- 2048 and Block Blast now offer an explicit between-move stage break in long sessions after at least 90 seconds and 12 completed moves. The board is paused before the break; Continue requests an available native ad and restores the same board. No ad interrupts a drag/swipe; unavailable ads do not block continuation.
- Existing child/under-age ad policy, consent flow, accounts, balances, other games and weekly competition retained. Email confirmation unchanged.

## Validation
150 puzzle uniqueness/solution checks; 34 authenticated server assertions (owner isolation, replay, hints/undo, pause, receipt verification and wallet/weekly balance); hosted UI flow and network/wallet recovery; 90-second checkpoint/pause/resume/cooldown test; fixed-banner route coverage for all ten game routes; existing ad-stability regression; 17 V2 platform assertions and 22 weekly competition assertions. Browser viewport checks at 360×640 and 320×550 found no game-screen overflow. AAB build and bundle/signature validation completed separately.

Physical-device AdMob fill, consent presentation and rewarded SSV delivery still require an installed-device test. Browser web version has no native AdMob SDK and does not simulate a paid ad. This release is not automatically uploaded to Play Console.

Policy reference: https://support.google.com/admob/answer/6201362
