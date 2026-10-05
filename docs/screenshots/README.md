# Screenshots

Screenshots of THE Note 0.2.9 with example and fixture notes, not private documents. All of them are reproduced with `node scripts/screenshots.mjs` in Chromium at 2× scale, with the native layer simulated so the desktop chrome is shown.

- `note-light.png` / `note-dark.png`: the trip note from `examples/Reiseplanung.md` (ideas, checklist, a small cost calculation and its output) in both themes. Used as the README and website lead images.
- `mandelbrot-dark.png`: the Mandelbrot block of the Spielplatz with its full output.
- `toolbox-light.png`: the Werkzeugkasten example in the light theme with the calendar block's output.
- `folders-and-date.png`: notes folder with sub folders, nested notes and the inline date picker.
- `gallery.png`: a travel note whose six pictures form a gallery in grid layout.
- `image-viewer.png`: the full-window image viewer with the gallery's thumbnails.
- `slash-menu.png`: the slash menu in a workshop note, scrolled to the AI quick actions and the focus & calm blocks.
- `moderation.png`: a workshop note with a drawn speaking order (real output), dot voting and ROTI tables.
- `focus.png`: a filled-in daily focus and the box breathing exercise with its real output (run with `time.sleep` turned off, so it takes no minute).
- `quick-actions.png`: meeting notes with the `/todos` quick action; the draft is a fixture, no API request.
- `unsaved-diff.png`: saved-text comparison with additions and deletions.
- `inline-ai.png`: raw Markdown draft before acceptance. The model name and response are explicit demo fixtures; no API key or external request is used.

The gallery photos are painted on a canvas by `scripts/demo-photos.js` (simple Lisbon scenes), so no third-party or private photos are used.

Code output is real: the script executes each pictured block locally with `bash`, `python3` or `node` (inside a temporary folder where paths matter) and places that output into the note.

The original user feedback screenshots are archived separately under `docs/history/attachments/` as part of the requested conversation history.
