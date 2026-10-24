# LUMI

Live: https://mubaristi-create.github.io/lumi-app/

Static frontend on GitHub Pages; Supabase Auth, PostgreSQL wallets, game sessions, private notifications and Storage. Only the publishable key is in the frontend. No password or service-role key belongs in this repository.

## Current rules

- Flappy: each obstacle +1 LUMI; sun +3; level congratulation does not stop play.
- Tower: each placed cube +1.
- Fruit: five fruits +1.
- 2048: 16 +1, 32 +2, 64 +3 and so on. Server-owned board.
- Cat: starts with 3 lives; each new road +1, maximum 5 per level; engine/horn sound disabled.
- Block: each completed level +1; sun +1; loss resets the same level without a loss ad. Server-owned board and progression.
- Daily mascot: once per 24 hours, 60 seconds, each accepted tap +1.
- Hourly gift: demo ad, +100 once per hour, server cooldown and idempotent credit. Ads are 2-second placeholders, not a connected commercial ad provider.

Campaign: 10000 LUMI / 5 AZN, first five eligible participants, status soon until dates are configured. No automated payout/winner selection.

## Admin

/admin.html: profiles, audited balance adjustments, private notifications, announcements, settings and campaign covers. Cover upload accepts JPG/PNG/WebP up to 5 MB and fits into 1200×800 (3:2), preserving proportions. Uploaded avatars are available to signed-in members via signed URLs; profile emails and phone numbers are not exposed by ranking.

SQL migrations are in supabase/migrations in the local development checkout. Apply in order. Migration 007 updates the rules above, hourly gift and notification policies.

## Validation limits

Block and 2048 validate board operations on the server. Action games validate event ordering, reward rules and broad pace limits; they do not replay all collision physics or provide full bot detection. Stronger validation is required before cash campaigns. Real ad-provider verification and push notifications are not implemented.

## Development

Use HTTPS for production and email callbacks. Use a local web server for local previews. Auth is persisted by Supabase; returning signed-in users land on the home screen. Physical Android/iPhone testing is separate from desktop/runtime checks.
