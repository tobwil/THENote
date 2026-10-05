#!/usr/bin/env python3
"""Collect installed dependency license texts for source/release attribution.

Usage: cargo metadata --manifest-path src-tauri/Cargo.toml --format-version 1 \
--filter-platform aarch64-apple-darwin > /tmp/note-cargo-metadata.json
python3 scripts/collect-licenses.py /tmp/note-cargo-metadata.json
"""
import json
import re
import shutil
import sys
from pathlib import Path
from urllib.parse import quote
root = Path(__file__).resolve().parent.parent
output = root / 'licenses/third-party'
output.mkdir(parents=True, exist_ok=True)
rows, missing = [], []
def collect(ecosystem, name, version, declared, directory, homepage):
    label = re.sub(r'[^A-Za-z0-9._-]', '_', name) + '-' + version
    dest = output / ecosystem / label
    found = []
    if directory.is_dir():
        for candidate in sorted(directory.iterdir()):
            if candidate.is_file() and re.match(r'^(licen[sc]e|copying|notice|ofl)(?:[._-]|$)', candidate.name, re.I):
                dest.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(candidate, dest / candidate.name)
                relative = (dest / candidate.name).relative_to(root).as_posix()
                found.append(f'[{candidate.name}]({quote(relative)})')
    if not found and dest.is_dir():
        # Preserve reviewed supplements for archives omitting license files.
        for candidate in sorted(dest.iterdir()):
            if candidate.is_file():
                relative = candidate.relative_to(root).as_posix()
                found.append(f'[{candidate.name}]({quote(relative)})')
    if not found:
        missing.append(f'{ecosystem}: {name}@{version}')
    rows.append(f'| {ecosystem} | [{name}]({homepage}) | {version} | {(declared or "See upstream license").replace("|", " / ")} | {", ".join(found) or "See upstream source"} |')
lock = json.loads((root / 'package-lock.json').read_text())
for path, entry in sorted(lock['packages'].items()):
    if not path or entry.get('dev'):
        continue
    directory = root / path
    pkg = json.loads((directory / 'package.json').read_text()) if (directory / 'package.json').exists() else {}
    name = pkg.get('name', path.split('node_modules/')[-1])
    declared = entry.get('license') or pkg.get('license')
    if isinstance(declared, dict): declared = declared.get('type')
    collect('npm', name, entry['version'], declared, directory, 'https://www.npmjs.com/package/' + name)
metadata = json.loads(Path(sys.argv[1]).read_text())
for pkg in sorted(metadata['packages'], key=lambda p: (p['name'], p['version'])):
    if pkg['source'] is None:
        continue
    collect('rust', pkg['name'], pkg['version'], pkg.get('license'), Path(pkg['manifest_path']).parent,
        pkg.get('repository') or 'https://crates.io/crates/' + pkg['name'])
header = '''# Third-party notices · THE Note 0.2.13

THE Note combines the [Sarala](https://github.com/solancer/sarala) editor (GPL-3.0-or-later) with [Ledge](https://github.com/ledgesh/ledge) concepts and its Apache-2.0 frontmatter parser. See [NOTICE.md](NOTICE.md) and [LICENSING.md](LICENSING.md) for their exact provenance. Existing emoji and Unicode notices also remain in [licenses](licenses).

This generated inventory lists the production npm dependency closure in `package-lock.json` and the resolved macOS/Apple Silicon Cargo metadata for this release, including native build/test dependencies. It is deliberately broader than code actually emitted into the app. It is not an assertion that every listed package ships at runtime. Each dependency retains its original license; collected upstream license/notice files are copied without changes. The declared SPDX expressions below do not replace their texts.

Regenerate using [scripts/collect-licenses.py](scripts/collect-licenses.py) after installing dependencies and producing Cargo metadata as described in the script. npm packages absent from the local installation or upstream packages without a top-level license file are linked to their upstream sources.

| Ecosystem | Package | Version | Declared license | Collected original texts |
| --- | --- | --- | --- | --- |
'''
(root / 'THIRD_PARTY_NOTICES.md').write_text(header + '\n'.join(rows) + '\n')
print(f'Collected inventory for {len(rows)} dependencies; no top-level text found for {len(missing)}:')
print('\n'.join(missing))
