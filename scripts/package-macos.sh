#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [ "$(uname -s)" != Darwin ]; then
  echo 'This packaging script requires macOS.' >&2
  exit 1
fi
npm run desktop:build -- --bundles app
release_dir="${THE_NOTE_RELEASE_DIR:-release}"
mkdir -p "$release_dir"
ditto 'src-tauri/target/release/bundle/macos/THE Note.app' "$release_dir/THE Note.app"
# Seal the complete bundle, including Info.plist and icons. This is a local,
# ad-hoc signature; distribution with notarization requires an Apple identity.
codesign --force --deep --sign - "$release_dir/THE Note.app"
codesign --verify --deep --strict "$release_dir/THE Note.app"
architecture="$(uname -m)"
ditto -c -k --sequesterRsrc --keepParent "$release_dir/THE Note.app" "$release_dir/THE Note-macOS-${architecture}.zip"
# Distribute original license texts and project attribution beside the app.
zip -q -r "$release_dir/THE Note-macOS-${architecture}.zip" LICENSE NOTICE.md LICENSING.md THIRD_PARTY_NOTICES.md licenses docs/upstream/LEDGE-LICENSE docs/upstream/LEDGE-THIRD-PARTY-NOTICES.md
shasum -a 256 "$release_dir/THE Note-macOS-${architecture}.zip"
