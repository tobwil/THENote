# Screenshots

Screenshots of THE Note 0.2.9 with example and fixture notes, not private documents. All of them are reproduced with `node scripts/screenshots.mjs` in Chromium at 2× scale, with the native layer simulated so the desktop chrome is shown.

- `note-light.png` / `note-dark.png`: the trip note from `examples/Reiseplanung.md` (ideas, checklist, a small cost calculation and its output) in both themes. Used as the README and website lead images.
- `mandelbrot-dark.png`: the Mandelbrot block of the Spielplatz with its full output.
- `toolbox-light.png`: the Werkzeugkasten example in the light theme with the calendar block's output.
- `folders-and-date.png`: notes folder with sub folders, nested notes and the inline date picker.
- `gallery.png`: a travel note whose six pictures form a gallery in grid layout.
- `image-viewer.png`: the full-window image viewer with the gallery's thumbnails.
- `unsaved-diff.png`: saved-text comparison with additions and deletions.
- `inline-ai.png`: raw Markdown draft before acceptance. The model name and response are explicit demo fixtures; no API key or external request is used.

The gallery photos are painted on a canvas by `scripts/demo-photos.js` (simple Lisbon scenes), so no third-party or private photos are used.

Code output is real: the script executes each pictured block locally with `bash`, `python3` or `node` (inside a temporary folder where paths matter) and places that output into the note.

The original user feedback screenshots are archived separately under `docs/history/attachments/` as part of the requested conversation history.
