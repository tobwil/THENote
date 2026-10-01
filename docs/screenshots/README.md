# Screenshots

Screenshots of THE Note 0.2.3 with example and fixture notes, not private documents. All of them are reproduced with `node scripts/screenshots.mjs` in Chromium at 2× scale, with the native layer simulated so the desktop chrome is shown.

- `playground-dark.png`: the Spielplatz example in THE Note Dark with the dice oracle's output.
- `mandelbrot-dark.png`: the Mandelbrot block of the Spielplatz with its full output.
- `toolbox-light.png`: the Werkzeugkasten example in the light theme with the calendar block's output.
- `projects-and-date.png`: project tree, nested notes and the inline date picker.
- `unsaved-diff.png`: saved-text comparison with additions and deletions.
- `inline-ai.png`: raw Markdown draft before acceptance. The model name and response are explicit demo fixtures; no API key or external request is used.

Code output is real: the script executes each pictured block locally with `bash`, `python3` or `node` (inside a temporary folder where paths matter) and places that output into the note.

The original user feedback screenshots are archived separately under `docs/history/attachments/` as part of the requested conversation history.
