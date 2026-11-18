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
The archive workflow continues building immutable iOS source `15e26664330db5e56f4fbe5ece7022b005c193dd`.
Release helper code is checked out separately from the manually dispatched trusted main commit.

## Run

Actions → iOS TestFlight archive → Run workflow → main → unique positive build_number → upload=true.
Missing/invalid API secrets stop before npm install/archive.
A local format check is not proof of Apple authorization; validation/upload must succeed.
Upload-only recovery currently targets the previously selected run 44135967371/build 1; that old run never produced an IPA.
Change the recovery artifact run/name/build checks to an actually successful signed archive before using recovery.

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
