#!/usr/bin/env bash
# Package a prepared release folder without changing the enclosed app/signature.
set -euo pipefail
if [ "$(uname -s)" != Darwin ] || [ "$#" -ne 2 ]; then
  echo 'Usage (macOS): bash scripts/create-dmg.sh RELEASE_FOLDER OUTPUT.dmg' >&2
  exit 1
fi
source_dir="$(cd "$1" && pwd)"
output_dir="$(dirname "$2")"
mkdir -p "$output_dir"
output="$(cd "$output_dir" && pwd)/$(basename "$2")"
if [ -e "$output" ] || [ -L "$output" ]; then
  echo "Refusing to replace an existing disk image: $output" >&2
  exit 1
fi
codesign --verify --deep --strict "$source_dir/THE Note.app"
work="$(mktemp -d "${TMPDIR:-/tmp}/the-note-dmg.XXXXXX")"
trap 'rm -rf "$work"' EXIT
ditto "$source_dir" "$work/volume"
ln -s /Applications "$work/volume/Applications"
hdiutil create -volname 'THE Note' -srcfolder "$work/volume" -fs HFS+ -format UDZO "$work/THE Note.dmg"
hdiutil verify "$work/THE Note.dmg"
mv "$work/THE Note.dmg" "$output"
printf 'Created %s\n' "$output"
