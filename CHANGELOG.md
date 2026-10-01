# Changelog

The entries below reconstruct the development milestones from the conversation and validated local versions. Versions 0.1.0–0.2.3 were developed on 2026-10-01 before the first source publication; they are **not fabricated historical Git commits or previous GitHub releases**.

## Unreleased

- Add **tables with spreadsheet formulas**: cells starting with `=` (e.g. `=SUMME(D2:D4)`, `=B2*C2`) show their result while the Markdown keeps the formula; editing the table shows the formulas. German and English function names, ranges and whole columns (`=SUMME(D:D)` in a total row sums the rows above), currencies, spreadsheet error codes with an explaining tooltip. Insert via `/formel`, the command palette or Paragraph ▸ Table.
- Add **THE Note Dark**, a forest-green theme with a lime accent. The ◐ toggle switches between THE Note and THE Note Dark; first launch follows the system appearance.
- Add the **Spielplatz** (countdown, dice oracle, Sierpinski triangle, Mandelbrot, stoppable aquarium) and **Werkzeugkasten** (runtimes, folder overview, Git, calendar, CSV, JSON, passphrase) notes as templates under ＋ Neue Notiz and in `examples/`. All blocks are read-only.
- Raise small interface text to readable sizes, align the run bar, keep the status bar on one line in narrow windows, show frontmatter as a labelled context card and close the template menu on outside click or Escape.
- Redesign the website with a live cell that runs three demos in the browser, a day/night preview, a feature grid and self-hosted Inter; publish it in German (`/`) and English (`/en/`) with hreflang links.
- Add an English README and refresh all screenshots with locally executed output.
- Lead with the notebook: README, website and screenshots open with an ordinary note (`examples/Reiseplanung.md`) whose single code block does a small calculation; the website's hero is now an interactive THE Note window (live Markdown on click, tasks, sidebar notes, light/dark, a small runnable block) followed by a pinned-screenshot story, and code examples move further back.

## Distribution and website — 2026-10-01

The application remains version 0.2.3; this update adds distribution and documentation.

- Publish a GitHub Pages website with app screenshots, installation tabs, copy buttons and Sarala/Ledge credits.
- Offer a Homebrew cask through the repository's own tap, with an explicit trust step for Homebrew 6.
- Add a curl installer that verifies the pinned release checksum, bundle signature, identifier and version, supports verification-only runs and keeps a backup on explicit replacement.
- Keep the website, installer and cask tied to `distribution.json`; deploy the static site through GitHub Actions.
- Document macOS/Apple Silicon support, installation, updates, removal and the preview's notarization limits.

## 0.2.3 — 2026-10-01

- Rename a saved or unsaved note through its tab: double-click, right-click or F2. Preserve unsaved content, undo history and per-tab state.
- Create project folders, nested folders and Markdown notes. Keep empty folders visible; reject existing names when creating entries or renaming files.
- Insert a date inline through `/date` or `/datum`, with Today/Tomorrow, German and ISO formats, and a separate undo step.
- Show AI drafts as raw Markdown throughout generation and after completion. Render Mermaid only after accepting the draft into the document.
- Add native filesystem checks and browser regression coverage for the new flows.

### First open-source publication

- Publish the source on [tobwil/THENote](https://github.com/tobwil/THENote), preserving the repository's existing initial commit.
- Credit Sarala and Ledge prominently, retain original license texts, clarify GPL-3.0-or-later for the combined work and Apache-2.0 for the Ledge-derived parser.
- Include screenshots, dependency license notices, contributor guidance, validation records and the visible development conversation with its original user attachments.
- Provide the macOS Apple Silicon development build as a prerelease. The bundle is locally/ad-hoc signed and is not Apple-notarized.

## 0.2.2 — 2026-10-01

- Add **± Änderungen**: compare the current Markdown draft with the last successfully loaded or saved text.
- Show inserted/deleted lines, line numbers and surrounding context, including new documents.
- Keep comparison baselines per tab and outside undo history. Account for edits made during saves, failures, reloads and recovered drafts.
- Bound large comparisons and previews to keep the interface responsive.

## 0.2.1 — 2026-10-01

- Align the normal writing surface to the left with a stable gutter on wide windows; retain centered focus mode.
- Fix focus handoff for manually typed `/ai`, including Enter, Tab and clicking a slash-menu entry.
- Package updates separately to avoid overwriting a running app with unsaved notes.

## 0.2.0 — 2026-10-01

- Add an optional native AI connection with explicit document-context opt-in, streaming, cancellation and optional macOS Keychain storage.
- Support OpenAI, Claude, Gemini and internal/OpenAI-compatible APIs with model discovery.
- Replace the initially explored side-chat approach with `/ai` prompts directly inside documents.
- Accept AI drafts as ordinary Markdown in one undo step; preserve per-block drafts across tab changes and reject stale results.
- Test providers against local HTTP fixtures and the interface through simulated native IPC; no paid provider validation is claimed.

## 0.1.0 — 2026-10-01

- Combine Sarala's SolidJS/Tauri Markdown editor with Ledge's frontmatter parser and executable-notebook concepts.
- Introduce THE Note's identity, themes, welcome note and templates.
- Run local shell, Python and JavaScript code blocks with streaming output, cancellation, time/output limits and an activity panel.
- Respect `cwd`, `env` and `confirm`; reject unsupported remote/profile configuration.
- Retain editor features including tabs, undo, diagrams, search, export and Markdown files.
- Build and test the initial macOS Apple Silicon application.

## Ideas discussed but not yet implemented

`/summarize`, `/format`, `/rewrite`, `/tasks` and `/translate`; persistent PTY sessions; SSH and remote execution; signed/notarized releases and a project-owned update service.

Full context: [conversation archive](docs/history/README.md), [architecture](docs/REENGINEERING.md), [validation](docs/VALIDATION.md).
