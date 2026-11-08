# Lumi 1.6.4 / Android 14

Lumi Tiles is integrated into the existing games carousel and auth session. Azerbaijani glyphs use bundled Noto Sans (OFL); locked worlds use four distinct new illustrations. Tiles rewards use server replay, high-water marks per account/level and audited ledger credit: 100 game points → 5 Lumi, with an admin daily cap. Admin supports points and helper inventory. Weekly rank medals are derived separately from manual badges. EYO uses the visual viewport and a fixed gameplay grid. Flappy uses bounded canvas resolution, cached scenery, stable palettes and background pause.

The additive Supabase migration 202611080022 was approved by the owner and applied on 2026-11-08. First-world gameplay remains 20 Sakura levels; worlds 2–5 remain preview maps from the previously scoped prototype. Rewarded ad grants remain disabled without a verified ad-provider adapter.

Validation: 39 engine/state tests; 24 isolated PostgreSQL checks; host retry/auth tests; strict CSP and iframe script hashes. Browser layout verified at 360×640 and 430×800 for EYO without document scrolling. Physical low-end device FPS has not been measured.
