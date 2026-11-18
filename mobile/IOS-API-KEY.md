# Lumi — App Store Connect Team API key authentication

GitHub Actions environment: `ios-release` (only main branch).
Both archive/upload and upload-recovery workflows use only Team API key authentication.
App-Specific Password and Apple-account password are not used by these GitHub workflows.

## Secrets

Set these under Settings → Environments → ios-release → Environment secrets:

| Secret | Value |
| --- | --- |
| ASC_KEY_ID | Key ID for the App Store Connect TEAM API key |
| ASC_ISSUER_ID | Issuer ID (UUID) shown under Team Keys |
| ASC_PRIVATE_KEY | Complete downloaded .p8 PEM, including BEGIN/END PRIVATE KEY and actual newlines; not base64 |

Create a Team key in App Store Connect → Users and Access → Integrations → App Store Connect API → Team Keys.
Developer is sufficient for build upload. This is not an In-App Purchase key, APNs key, individual key, Distribution certificate or Apple login password.
Download the .p8 only into a private location; never commit it or send it in chat.

Existing Distribution P12/profile signing secrets remain required. API authentication does not sign the IPA.
The archive workflow continues building immutable iOS source `6da961075581682f0f64f39358c343092a32e959`.
Release helper code is checked out separately from the manually dispatched trusted main commit.

## Run

Actions → iOS TestFlight archive → Run workflow → main → unique positive build_number → upload=true.
Missing/invalid API secrets stop before npm install/archive.
A local format check is not proof of Apple authorization; validation/upload must succeed.
Upload-only recovery asks for source_run_id and build_number. Select a run which actually produced a signed archive artifact; the artifact name and bundle build version must match.
Before macOS allocation, the archive workflow uses a short-lived ES256 JWT for a read-only Apple API check of access to the configured app. It never logs the JWT or raw Apple response.
On 2026-11-18 this real authorization check succeeded in run 44344442125 for build 3; archive/upload completion must be checked separately.

## Secret handling

Only the upload/check steps receive the API secrets. Shell tracing is disabled.
The raw .p8 is normalized for CRLF and written with 0600 permissions under a unique runner temporary directory.
Its name is AuthKey_<Key ID>.p8 in ./private_keys, used by altool with --apiKey/--apiIssuer.
OpenSSL validates a P-256 key. EXIT/INT/TERM handling removes the temporary key and response log on normal completion/failure/cancellation that delivers a signal.
Runner hard termination relies on disposal of the ephemeral hosted machine.
Raw altool responses are intentionally withheld from public logs and are never uploaded as artifacts.
Only the stage and exit code are reported on errors. Check key role, matching IDs, bundle/version and Apple's delivery email to diagnose an Apple rejection.
Existing App-Specific Password secrets are unused; revoke obsolete credentials through Apple and remove obsolete CI secrets when appropriate.

The unrelated optional Codemagic fallback is not configured by this GitHub migration.
Neither this change nor its mock tests prove a signed iOS build or TestFlight upload succeeded.
No Android/web application or Supabase data changes are included.

## macOS Bash compatibility fix

The release script must not expand an empty array under macOS Bash 3.2 with nounset. When Apple sign-in is disabled, it now passes an explicit empty CODE_SIGN_ENTITLEMENTS assignment; the enabled case still selects App/App.entitlements. Build 3 stopped before archive due to the empty-array error. Build 4/run 44349314513 uses the corrected source; check the run before claiming upload success.

## Verified release — 2026-11-18

Version 2.0.8 (build 6) archived, exported, validated and uploaded to Apple successfully with the team API key in [run 44354548052](https://github.com/mubaristi-create/lumi-app/actions/runs/44354548052). Signed IPA and dSYMs are in artifact `Lumi-iOS-TestFlight-6` (14-day retention). Apple processing/tester availability is separate from upload success.

The archive and recovery workflows use `macos-15-intel` with Xcode `26.3`: the macOS 26 ARM runner pool failed to provision within 15 minutes, and an earlier Xcode 26.0 selection reported its iOS platform unavailable. App source remains pinned to `6da961075581682f0f64f39358c343092a32e959`. No Android, web application or Supabase production changes were made for these CI fixes.
