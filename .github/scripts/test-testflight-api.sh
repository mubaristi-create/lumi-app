#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/../.." && pwd)"
helper="$root/.github/scripts/upload-testflight-api.sh"
fixture="$(mktemp -d)"
trap 'rm -rf "$fixture"' EXIT
mkdir "$fixture/bin" "$fixture/temp"
export RUNNER_TEMP="$fixture/temp"
export ASC_KEY_ID=TESTKEY123
export ASC_ISSUER_ID=11111111-2222-3333-4444-555555555555
openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:prime256v1 -out "$fixture/key.p8" 2>/dev/null
export ASC_PRIVATE_KEY="$(cat "$fixture/key.p8")"
export MOCK_CALLS="$fixture/calls"
printf 'test IPA' > "$fixture/App.ipa"
cat > "$fixture/bin/xcrun" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
[[ "$1" == altool ]] || exit 91
[[ "$2" == --validate-app || "$2" == --upload-app ]] || exit 92
[[ "$*" != *--username* && "$*" != *--password* ]] || exit 93
[[ -f "private_keys/AuthKey_$ASC_KEY_ID.p8" ]] || exit 94
[[ "$(stat -c %a "private_keys/AuthKey_$ASC_KEY_ID.p8")" == 600 ]] || exit 95
printf '%s\n' "$2" >> "$MOCK_CALLS"
# Simulate a tool emitting secrets: the wrapper must withhold all raw output.
printf '%s\n' "$ASC_KEY_ID" "$ASC_ISSUER_ID" "$ASC_PRIVATE_KEY" 'sensitive-response-canary'
if [[ "${MOCK_FAIL_VALIDATE:-0}" == 1 && "$2" == --validate-app ]]; then exit 17; fi
MOCK
chmod +x "$fixture/bin/xcrun"
export PATH="$fixture/bin:$PATH"
assert_clean() { [[ -z "$(find "$RUNNER_TEMP" -mindepth 1 -print -quit)" ]] || { echo 'Temporary key cleanup failed'; exit 1; }; }
assert_redacted() {
  if grep -Eq 'TESTKEY123|11111111-2222-3333-4444-555555555555|BEGIN PRIVATE KEY|sensitive-response-canary' "$fixture/output"; then echo 'Sensitive data leaked'; exit 1; fi
}
bash "$helper" --check > "$fixture/output" 2>&1
assert_clean
assert_redacted
[[ ! -f "$MOCK_CALLS" ]]
bash "$helper" "$fixture/App.ipa" > "$fixture/output" 2>&1
[[ "$(cat "$MOCK_CALLS")" == $'--validate-app\n--upload-app' ]]
assert_clean
assert_redacted
rm "$MOCK_CALLS"
if MOCK_FAIL_VALIDATE=1 bash "$helper" "$fixture/App.ipa" > "$fixture/output" 2>&1; then exit 1; fi
[[ "$(cat "$MOCK_CALLS")" == --validate-app ]]
assert_clean
assert_redacted
if ASC_KEY_ID='../escape' bash "$helper" --check > "$fixture/output" 2>&1; then exit 1; fi
if ASC_PRIVATE_KEY='' bash "$helper" --check > "$fixture/output" 2>&1; then exit 1; fi
if ASC_PRIVATE_KEY='not a key' bash "$helper" --check > "$fixture/output" 2>&1; then exit 1; fi
if ASC_ISSUER_ID='' bash "$helper" --check > "$fixture/output" 2>&1; then exit 1; fi
assert_clean
printf '%s\n' 'Passed: API-only calls, missing/invalid secrets, private file permissions, cleanup, failure ordering and log redaction.'
