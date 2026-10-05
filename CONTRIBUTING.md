# Contributing

Issues and pull requests are welcome at [tobwil/THENote](https://github.com/tobwil/THENote).

Use Node.js 22.12+ (24+ recommended), npm and stable Rust. Native development also requires the platform's Tauri prerequisites; macOS builds require Xcode Command Line Tools.

```sh
npm ci
npm run desktop
```

Before submitting changes, run the checks relevant to your change:

```sh
npm run typecheck
npm run lint
npm test
npm run test:notebook
npm run test:ai:ui
npm run test:diff:ui
npm run test:workspace:ui
cargo test --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
```

UI tests use Playwright Chromium or installed Google Chrome. Install Chromium with `npx playwright install chromium` if needed. Tests use fixture notes and simulated AI responses rather than real API credentials. Keep keys, personal notes, local build paths and user settings out of commits.

Explain the problem, resulting behavior and validation in your pull request. Preserve Markdown portability, explicit AI-context opt-in, unsaved buffers and undo history. Update the changelog and relevant documentation when behavior changes.

Read [LICENSING.md](LICENSING.md) before contributing. Preserve Sarala, Ledge and dependency attribution. New project code is contributed under GPL-3.0-or-later; the Ledge-derived parser retains its Apache-2.0 notices.

## Website and distribution

`site/` is the static GitHub Pages website. Run `npm run build:site` to generate `dist-site/` and `npm run test:site` for browser checks. Update release metadata in `distribution.json`, then run `node scripts/sync-distribution.mjs` to synchronize the installer and Homebrew cask. See [installation and release maintenance](docs/INSTALLATION.md). Never publish an unverified checksum or silently bypass macOS security controls.

## Release tests and report

For every release, run `npm run test:release` with Cargo on PATH. This runs the unit, native, selected browser and website suites sequentially, retains individual logs and writes Markdown/JSON reports under `release/tests-v<version>-<timestamp>/`. A failed or timed-out suite produces a failing exit status; the remaining suites still run. After correcting a failure, rerun the affected check and record it; rerun the whole suite when changes affect multiple areas.

Add regression coverage for new behavior and fixes, especially file preservation and unsaved notes. Publish a versioned `docs/VALIDATION-v<version>.md` with results, test counts where available, discovered/fixed failures, and explicit limits. Provide the user a linked test report after each build. Record package signing, notarization, checksum and live-download checks separately after packaging; browser tests do not prove native clipboard or first-launch behavior.
