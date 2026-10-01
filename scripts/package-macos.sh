#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [ "$(uname -s)" != Darwin ]; then
  echo 'This packaging script requires macOS.' >&2
  exit 1
fi
if [ "$#" -gt 1 ]; then
  echo 'Usage: npm run package:macos -- [--preview|--notarized]' >&2
  exit 1
fi
mode="${1:---preview}"
case "$mode" in
  --preview)
    echo 'Building an ad-hoc signed preview (not Apple-notarized).'
    identity=-
    ;;
  --notarized)
    : "${APPLE_SIGNING_IDENTITY:?Set the full Developer ID Application identity name}"
    : "${THE_NOTE_NOTARY_PROFILE:?Set a notarytool Keychain profile}"
    case "$APPLE_SIGNING_IDENTITY" in
      'Developer ID Application: '*) identity="$APPLE_SIGNING_IDENTITY" ;;
      *) echo 'Notarized releases require a Developer ID Application certificate.' >&2; exit 1 ;;
    esac
    # Fail before building if the identity or notarization credentials are missing.
    security find-identity -v -p codesigning | grep -F -- "\"$identity\"" >/dev/null
    xcrun notarytool history --keychain-profile "$THE_NOTE_NOTARY_PROFILE" >/dev/null
    ;;
  *) echo 'Usage: npm run package:macos -- [--preview|--notarized]' >&2; exit 1 ;;
esac
release_dir="${THE_NOTE_RELEASE_DIR:-release}"
mkdir -p "$release_dir"
release_dir="$(cd "$release_dir" && pwd)"
architecture="$(uname -m)"
asset="THE.Note-macOS-${architecture}"
for name in "$asset.zip" "$asset.dmg" SHA256SUMS; do
  if [ -e "$release_dir/$name" ] || [ -L "$release_dir/$name" ]; then
    echo "Refusing to replace $release_dir/$name; use a fresh THE_NOTE_RELEASE_DIR." >&2
    exit 1
  fi
done
# Tauri signs nested code. This script notarizes the final sealed bundle below.
env -u APPLE_ID -u APPLE_PASSWORD -u APPLE_API_KEY -u APPLE_API_ISSUER -u APPLE_API_KEY_PATH \
  APPLE_SIGNING_IDENTITY="$identity" npm run desktop:build -- --bundles app
work="$(mktemp -d "${TMPDIR:-/tmp}/the-note-package.XXXXXX")"
trap 'rm -rf "$work"' EXIT
notarize() {
  xcrun notarytool submit "$1" --keychain-profile "$THE_NOTE_NOTARY_PROFILE" --wait \
    --output-format json > "$work/notary-result.json"
  cat "$work/notary-result.json"
  node -e 'const fs = require("node:fs"); const result = JSON.parse(fs.readFileSync(process.argv[1], "utf8")); if (result.status !== "Accepted") { console.error("Apple did not accept the notarization submission."); process.exit(1); }' "$work/notary-result.json"
}
mkdir -p "$work/stage/docs/upstream" "$work/output"
app="$work/stage/THE Note.app"
ditto 'src-tauri/target/release/bundle/macos/THE Note.app' "$app"
if [ "$mode" = --preview ]; then
  codesign --force --deep --sign - "$app"
else
  # Nested code is already signed by Tauri; seal the outer bundle last.
  codesign --force --sign "$identity" --options runtime --timestamp "$app"
fi
codesign --verify --deep --strict "$app"
if [ "$mode" = --notarized ]; then
  ditto -c -k --sequesterRsrc --keepParent "$app" "$work/notarize.zip"
  notarize "$work/notarize.zip"
  xcrun stapler staple "$app"
  xcrun stapler validate "$app"
  spctl --assess --type execute --verbose=2 "$app"
fi
# Both formats contain the same app and original attribution/license texts.
cp LICENSE NOTICE.md LICENSING.md THIRD_PARTY_NOTICES.md "$work/stage/"
ditto licenses "$work/stage/licenses"
cp docs/upstream/LEDGE-LICENSE docs/upstream/LEDGE-THIRD-PARTY-NOTICES.md "$work/stage/docs/upstream/"
ditto -c -k --sequesterRsrc "$work/stage" "$work/output/$asset.zip"
bash scripts/create-dmg.sh "$work/stage" "$work/output/$asset.dmg"
if [ "$mode" = --notarized ]; then
  codesign --sign "$identity" --timestamp "$work/output/$asset.dmg"
  notarize "$work/output/$asset.dmg"
  xcrun stapler staple "$work/output/$asset.dmg"
  xcrun stapler validate "$work/output/$asset.dmg"
  spctl --assess --type open --context context:primary-signature --verbose=2 "$work/output/$asset.dmg"
fi
# Calculate checksums only after stapling, which changes the file bytes.
(cd "$work/output" && shasum -a 256 "$asset.zip" "$asset.dmg" > SHA256SUMS)
mv "$work/output/"* "$release_dir/"
cat "$release_dir/SHA256SUMS"
