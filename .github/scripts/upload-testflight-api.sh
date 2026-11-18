#!/usr/bin/env bash
# App Store Connect TEAM API key only. Never print credentials or raw altool output.
set +x
set -euo pipefail
fail() { printf '%s\n' "$1" >&2; exit 1; }
[[ "${ASC_KEY_ID:-}" =~ ^[A-Z0-9]{10}$ ]] || fail 'ASC_KEY_ID is missing or invalid.'
[[ "${ASC_ISSUER_ID:-}" =~ ^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$ ]] || fail 'ASC_ISSUER_ID must be a team API issuer UUID.'
[[ -n "${ASC_PRIVATE_KEY:-}" ]] || fail 'ASC_PRIVATE_KEY is missing; paste the complete .p8 PEM into the secret.'
mode="${1:-}"
if [[ "$mode" != --check ]]; then
  [[ -n "$mode" && -f "$mode" ]] || fail 'An existing IPA path is required.'
  ipa="$(cd "$(dirname "$mode")" && pwd)/$(basename "$mode")"
fi
umask 077
temp_root="${RUNNER_TEMP:-${TMPDIR:-/tmp}}"
key_dir="$(mktemp -d "$temp_root/lumi-asc.XXXXXX")"
cleanup() { rm -f "$key_dir/private_keys/AuthKey_$ASC_KEY_ID.p8" "$key_dir/altool.log"; rmdir "$key_dir/private_keys" "$key_dir" 2>/dev/null || true; }
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
mkdir "$key_dir/private_keys"
key_file="$key_dir/private_keys/AuthKey_$ASC_KEY_ID.p8"
printf '%s\n' "$ASC_PRIVATE_KEY" | tr -d '\r' > "$key_file"
chmod 600 "$key_file"
openssl pkey -in "$key_file" -check -noout >/dev/null 2>&1 || fail 'ASC_PRIVATE_KEY is not a valid unencrypted .p8 private key.'
openssl pkey -in "$key_file" -pubout 2>/dev/null |
  openssl pkey -pubin -text -noout 2>/dev/null |
  grep -q 'ASN1 OID: prime256v1' || fail 'ASC_PRIVATE_KEY must be an Apple ES256 (P-256) API key.'
if [[ "$mode" == --check ]]; then
  printf '%s\n' 'API secret formats checked; Apple authorization is verified during upload.'
  exit 0
fi
# altool discovers ./private_keys. Keep the key outside source and artifacts.
cd "$key_dir"
for operation in validate-app upload-app; do
  if xcrun altool "--$operation" --type ios --file "$ipa" --apiKey "$ASC_KEY_ID" --apiIssuer "$ASC_ISSUER_ID" > "$key_dir/altool.log" 2>&1; then
    printf '%s\n' "Apple $operation succeeded."
  else
    code=$?
    fail "Apple $operation failed (exit $code). Raw response withheld to protect credentials; check key permissions, bundle/version and Apple's email."
  fi
done
