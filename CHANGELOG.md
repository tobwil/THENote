# Changelog

The entries below reconstruct the development milestones from the conversation and validated local versions. Versions 0.1.0–0.2.3 were developed on 2026-10-01 before the first source publication; they are **not fabricated historical Git commits or previous GitHub releases**.

## Unreleased

- **Live output follows:** a running block's output scrolls with its newest line (breathing exercise, timers, countdowns) and comes into view when the run starts below the window. Scrolling up to read pauses following; „↓ Live folgen“ resumes.
- **Website „Tippe /“:** the getting-started section now shows real slash commands (Fokus & Moderation, KI & Werkzeuge) with links to the browser version and the full list, and all seven templates.

## 0.2.12 — 2026-10-05

- **Screenshots, README and website for the building blocks:** new shots of the slash menu, moderation, focus & calm and the /todos quick action; README sections for each; the website story gains chapter 04 „Ein Baustein für jeden Moment“, and the export card becomes „Drucken & Teilen“. Empty placeholders in the daily focus, gratitude, meeting and 5-Whys blocks now carry visible text, so they render as checkboxes and list items.

## 0.2.11 — 2026-10-05

- **Building blocks in the slash menu:** focus timer (Pomodoro), box breathing, daily focus, three good things, 5-4-3-2-1 grounding, meeting notes, a decision matrix with formulas, the Werkzeugkasten helpers and the Spielplatz pieces insert into the open note (one undo step). Werkzeugkasten/Spielplatz sections are read from the example notes, so the code exists once.
- **AI quick actions:** „Notiz zusammenfassen“, „To-dos herausziehen“ (who · what · by when), „Nächste Schritte ableiten“ and „Offene Fragen sammeln“ insert a prompt that starts right away with the note as context. They have their own group in the slash menu.
- **Moderation:** check-in question, random speaking order, agenda timebox with notifications, Crazy 8s, dot voting and ROTI (formula tables that count), Lean Coffee, 5 Whys, retrospective and rose · bud · thorn as slash blocks, and all of them as the „Moderationskoffer“ template.
- **Templates moved to the tab bar:** „Neue Notiz aus Vorlage“ sits as ⌄ beside the +; the note toolbar no longer offers new notes.
- **Teilen:** print and export (PDF, HTML, Word) from the note toolbar. Export dialogs start next to the note, and a notice says where the file went, with „Im Finder zeigen“ and „Öffnen“.

## 0.2.10 — 2026-10-05

- Fix immediate slash-command execution leaving part of the typed query in the note. Refresh the query and caret before click, Enter or Tab execution; cover all three with a regression test.

- **Browser version on GitHub Pages:** the editor is published at https://tobwil.github.io/THENote/app/ next to the website (`npm run build:webapp`, built by the Pages workflow on every change to the editor). Saving downloads the note; folders and running code stay in the Mac app. The website and both READMEs link it.
- **New screenshots:** folders and inline date (`folders-and-date.png`, replacing `projects-and-date.png`), a gallery grid (`gallery.png`) and the image viewer (`image-viewer.png`), with painted demo photos (`scripts/demo-photos.js`). The website gains a story chapter on pictures and galleries.
- **Pasted pictures show right away:** after pasting or inserting an image in the live view, the caret sits after it, so the picture appears instead of its `![](…)` path.
- **Drag pictures into galleries:** drag a picture from anywhere in the note (a text paragraph or its own block) onto a gallery or a single picture; it lands before or after the picture under the pointer, a bar marks the spot. Dragging inside a gallery reorders it; one undo step reverts a move, Esc cancels. Image files dragged from Finder onto a gallery join it at that spot.

## 0.2.9 — 2026-10-05

- Clicking or dragging the gallery scrollbar, gaps or layout controls keeps the gallery visible instead of opening Markdown source.

- **Gallery as a grid:** every gallery has a **▦ Raster / ⇆ Leiste** switch underneath. The grid shows all pictures at once in even tiles instead of a sideways strip; galleries of five or more pictures start as a grid. A switched gallery keeps its layout across re-renders and restarts; the Markdown stays plain images.

## 0.2.8 — 2026-10-05

- **Image galleries:** a paragraph of two or more images shows as a scrollable strip with ‹ › and a counter; clicking any picture opens a full-window viewer with thumbnails (← → to browse, Esc closes). The Markdown stays plain images.
- **Pictures move with their note:** moving a note into another folder takes the pictures it links below its folder along (`assets/…`, also absolute links from pasting into an unsaved note, which become relative). Pictures other notes use too are copied; a different file of the same name is kept and the link points to `name-1.png`. Picture folders (`assets`) no longer show in the sidebar.
- **Easier sorting:** drop a note onto a folder or onto any note inside it, see the target in the drag label, open a closed folder by resting on it, cancel with Esc. „In Ordner verschieben …“ can create a new folder and move the note there in one step.
- Add automatic release test reports, nine native image-file regression tests and gallery keyboard coverage. Preserve the original image when the destination resolves to the same file, including folder aliases.

## 0.2.7 — 2026-10-05

- **Paste images from the clipboard:** screenshots, images copied from apps or the browser and image files copied in Finder are saved next to the note (`assets/`, or the folder set by `copy-images-to` in the front matter) and linked relatively. Clipboard images get a dated name (`Bild-2026-10-05-143012.png`), copied files keep theirs. Works in the live editor and in Source mode; a note that is not saved yet stores the image in the notes folder; the browser editor embeds it. Text from Excel or Word stays text.

## 0.2.6 — 2026-10-02

- **Folders instead of projects:** the sidebar offers ＋ Notiz and ＋ Ordner at all times; with no folder open they set up *Documents/THE Note*. Move notes into folders by dragging them or with "In Ordner verschieben …" (open tabs follow), close the notes folder with × and have it reopened on the next start. The separate "＋ Projekt" step is gone.

## 0.2.5 — 2026-10-01

- Add a **diagram magnifier**: hovering a rendered Mermaid or D2 diagram shows **⤢ Vergrößern**, which opens it full-window with zoom and pan (pinch or ⌘/Ctrl + scroll, drag or scroll, double-click, + / − / 0 / 1, arrow keys, Esc). Also in the command palette as "Diagramm vergrößern".
- Keep multi-line Mermaid labels from being clipped by the note's paragraph line height.

## 0.2.4 — 2026-10-01

- Sign the Apple Silicon app and DMG with Developer ID, notarize both with Apple and staple their tickets. Publish matching ZIP/DMG packages with SHA-256 checksums; the curl installer also checks Gatekeeper.

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
