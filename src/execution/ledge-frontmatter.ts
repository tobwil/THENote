// SPDX-License-Identifier: Apache-2.0
// From ledgesh/ledge, commit 4dc8ec1153142c46f2a8331a8143ecaf4b2d1914.
// Original license: ../../docs/upstream/LEDGE-LICENSE
// Per-note shell parameters, read from a YAML-subset frontmatter block at the
// top of the note (architecture.md §6a).
//
// Shared because both ends parse the block and must agree on it. The view
// parses a note's frontmatter to send spawn params over sessionConfigure.
// slug.ts uses the block's extent, so a frontmatter note's title is its first
// content line rather than "---". The grammar is hand-rolled rather than a
// yaml dependency (architecture.md §8). It is a flat `key: value` list plus
// one indented map under `env:`. That covers what these params need, and it is
// small enough for its tests to specify fully.
//
// Only the block's shape lives here. What the values mean at spawn (~
// expansion, cwd fallback, profile file resolution, env precedence) is
// Bun-side policy, applied where the shell is spawned.
//
// Validation degrades per line, parseSettings-style: a bad line costs that
// line, never the rest of the block and never a crash. A note is hand-edited
// text, like settings.jsonc, so one typo must not cost the writer the rest of
// what they wrote.
//
// Every refusal is a `problem` carrying the line it is on, and the editor
// draws each one beside its line (mainview/editor/frontmatter.ts). These
// messages are user-facing text, so they follow docs/contributor/writing.md
// and contain no em dashes.
//
// Silence is what this block shipped with, and the problem list replaced it.
// An ignored misspelled key spawns the note's shells as though the line were
// not there, and nothing tells the writer why.

/** Parameters a note may declare. null / {} / [] mean "not declared". */
export interface NoteParams {
  // Working directory for the note's shells (inline-run, overflow, terminal).
  cwd: string | null;
  // Named secrets scope: resolves Bun-side to <profiles dir>/<name>.env, so
  // the note carries only the name, never the values.
  profile: string | null;
  // A project-owned dotenv file, resolved against cwd at spawn.
  envFile: string | null;
  // Inline non-secret vars, merged over the spawn env.
  env: Record<string, string>;
  // The machines this note's blocks may execute on: ssh destinations
  // (`user@host`, an ssh-config alias), or the reserved word "local". Empty
  // means undeclared, and everything runs locally, as it did before the key
  // existed. More than one entry means every run asks which member to target.
  // The list is an allowlist, enforced Bun-side (bun/index.ts resolveHost).
  hosts: string[];
  // The note's declared tags, spelled as written (leading "#" stripped;
  // identity is case-folded at comparison time, shared/tags.ts normalizeTag).
  // Never feeds a spawn. It lives here, and rides sessionConfigure inertly,
  // because the block has one parser. Inline #hashtags in the body are the
  // other tag source, and shared/tags.ts tagRefsOf merges the two.
  tags: string[];
  // Whether the note declares itself a template: `true`, `false`, or `daily`
  // (architecture.md §6a). A template appears in the "New Note from
  // Template…" picker, and instantiating it strips this line
  // (shared/template.ts) so instances are not templates too. `daily` names the
  // one template ⌘J and `ledge today` instantiate for each day's note
  // (bun/daily.ts findDailyTemplate). Which notes are templates, and which one
  // is the daily, is a fact about the notes, so the marker lives in the note
  // rather than in settings.jsonc: no registry to keep in sync, no restart to
  // apply it, nothing to go stale when the note retitles. Like tags, it never
  // feeds a spawn; it lives here because the block has one parser.
  template: boolean | "daily";
  // Whether every runnable block in this note asks before it executes
  // (interactions.md §4b). The key is the whole-note stance for a runbook
  // whose blocks are all consequential. A per-block `confirm` attribute on the
  // fence wins over it in both directions, so one harmless block in such a
  // runbook can still opt out with `confirm=no`. Whether a note's blocks ask
  // first is a fact about the note, not a setting about the app. Never feeds a
  // spawn; it lives here because the block has one parser.
  confirm: boolean;
  // Whether the note is one of the workspace's favorites: it sits in the note
  // browser's Favorites section as well as in its folder (interactions.md §3).
  // Which notes those are is a fact about the notes, so the marker lives in
  // the note, on the `template:` argument (architecture.md §6a): no registry
  // to keep in sync, nothing to go stale when the note retitles or moves. The
  // Favorite verbs write this line (bun/notes.ts favoriteNote) and it is
  // ordinary hand-editable text either way, unlike `locked:`. Never feeds a
  // spawn; it lives here because the block has one parser.
  favorite: boolean;
  // The note-locking crypto header (locking.md §2): non-null means the note's
  // body on disk is ciphertext. Bun owns the value's structure (bun/vault.ts
  // parseLockedHeader); here it is one opaque string, parsed like every key
  // because the block has one grammar. Unlike `template:`, this text is
  // Bun-owned: a save can never mint or drop it, only the Lock and Remove Lock
  // commands can. writeNote re-stamps the header from disk on every save, and
  // a hand-typed `locked:` line in an unlocked note is stripped with a warning
  // (bun/notes.ts sealFor), so the editor completion never offers the key.
  // Never feeds a spawn.
  locked: string | null;
}

/** The reserved `host:` member meaning "this machine, no ssh". */
export const LOCAL_HOST = "local";

/**
 * One thing wrong with the block, and the note line it is on (1-based, so it
 * indexes a CodeMirror document directly). The editor draws each message
 * beside its line (mainview/editor/frontmatter.ts), so the parser reports the
 * line rather than making the editor walk the block again. A second walk
 * drifts: shared/tags.ts needed an invariant test to keep its own in step with
 * this parser's line counting.
 */
export interface FrontmatterProblem {
  line: number;
  message: string;
}

export interface Frontmatter {
  params: NoteParams;
  problems: FrontmatterProblem[];
  // Offset of the first content character after the closing fence (0 when the
  // note has no frontmatter). slug.ts and the editor's block styling need it
  // and must agree with the parser on where the block ends, so the parser
  // returns it rather than letting them recompute it.
  end: number;
}

// Exactly three dashes, alone on the line. `\s*$` swallows trailing spaces and
// a stray \r from pasted CRLF text. Both are invisible, so without this the
// note's frontmatter would go unrecognised with nothing on the line to show
// why.
const FENCE = /^---\s*$/;

// The profile name becomes a filename under the profiles dir, so the accepted
// charset is safe by construction, the same move as slugify. No separators and
// no dots means no traversal, no ".env"-style hidden files, and nothing to
// escape. Exported because Bun re-checks the name at resolution
// (bun/spawnParams.ts): the view is the least-trusted end of the RPC. This
// check is the typo message and Bun's is the guard, so both ends must use this
// one predicate, or a name could pass one and surprise the other.
export function isProfileName(name: string): boolean {
  return /^[A-Za-z0-9_-]+$/.test(name);
}

// An ssh destination (`host`, `user@host`, an ssh-config alias) or "local".
// The charset accepts all four spellings. A leading "-" is refused because the
// destination becomes argv, where it would read as an ssh option (option
// injection). Whitespace, quotes and commas are refused because they would
// break the list syntax and the remote command line, and no real destination
// contains them. As with isProfileName, this check is the typo message and Bun
// re-applies the same predicate where the value is used (bun/index.ts
// resolveHost).
export function isHostName(name: string): boolean {
  return /^[A-Za-z0-9_.@:-]+$/.test(name) && !name.startsWith("-");
}

// What both tag grammars accept: letters (any script), digits, "_", "-" and
// "/", plus at least one letter or "_", so an issue number like `#123` or a
// year like `#2024` stays plain text. "/" is an accepted spelling
// (`project/ledge`) with no hierarchy semantics. The inline `#tag` scanner
// (shared/tags.ts) and the `tags:` list here share this predicate; otherwise
// a note could declare a tag it can never write inline.
export function isTagToken(token: string): boolean {
  return /^[\p{L}\p{N}_/-]+$/u.test(token) && /[\p{L}_]/u.test(token);
}

/**
 * Split a `tags:` value into its accepted tags and the tokens refused.
 * `tag` is the spelling with any leading "#" stripped. `raw` is the token
 * exactly as written, which the reveal re-finds on the line: `unbracket`
 * keeps every token a verbatim substring of the line. Dedupe is case-folded
 * and the first spelling wins. shared/tags.ts calls this when it locates the
 * `tags:` line for occurrence refs, so both ends accept the same list.
 */
export function splitTagList(value: string): {
  accepted: { tag: string; raw: string }[];
  rejected: string[];
} {
  const accepted: { tag: string; raw: string }[] = [];
  const rejected: string[] = [];
  for (const token of unbracket(value).split(/[,\s]+/)) {
    if (!token) continue;
    const tag = token.startsWith("#") ? token.slice(1) : token;
    if (!isTagToken(tag)) rejected.push(token);
    else if (!accepted.some((a) => a.tag.toLowerCase() === tag.toLowerCase())) {
      accepted.push({ tag, raw: token });
    }
  }
  return { accepted, rejected };
}

// Env var names as execve and every shell agree on them. Anything else
// (spaces, "=", unicode) is legal in envp but unreachable from a shell, so in
// a note it is a typo. The dotenv parsing in bun/spawnParams.ts shares this
// predicate, so a name means the same thing whether it was written in a note
// or in a profile file.
export function isEnvName(name: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
}

/**
 * Where a note's frontmatter block ends: the offset just past the closing
 * fence's newline, or 0 if the note has none. A block only exists when the
 * note's first line is `---` and a closing `---` line follows. An
 * unterminated opener counts as content, a markdown thematic break, rather
 * than as a block that swallowed the whole note.
 */
export function frontmatterEnd(text: string): number {
  const firstNl = text.indexOf("\n");
  if (firstNl === -1) return 0; // one line total: nothing can close a fence
  if (!FENCE.test(text.slice(0, firstNl))) return 0;
  let pos = firstNl + 1;
  while (pos <= text.length) {
    const nl = text.indexOf("\n", pos);
    const line = nl === -1 ? text.slice(pos) : text.slice(pos, nl);
    if (FENCE.test(line)) return nl === -1 ? text.length : nl + 1;
    if (nl === -1) break;
    pos = nl + 1;
  }
  return 0;
}

/** Parse a note's frontmatter into spawn params (see the header for grammar). */
export function parseFrontmatter(text: string): Frontmatter {
  const end = frontmatterEnd(text);
  const params: NoteParams = { cwd: null, profile: null, envFile: null, env: {}, hosts: [], tags: [], template: false, confirm: false, favorite: false, locked: null };
  const problems: FrontmatterProblem[] = [];
  if (end === 0) return { params, problems, end };

  // The lines between the fences: after the opener's newline, up to (not
  // including) the closing fence line itself.
  const innerStart = text.indexOf("\n") + 1;
  const inner = text.slice(innerStart, end).replace(/\r?\n?---\s*$/, "");

  // Indented lines are only meaningful directly under `env:`. This tracks
  // whether the loop is inside that map.
  let inEnv = false;

  // Line 1 is the opening fence, so the first inner line is line 2. The loop
  // advances this before its body, and `problem` closes over it so no report
  // site has to pass the number.
  let lineNumber = 1;
  const problem = (message: string) => problems.push({ line: lineNumber, message });

  for (const rawLine of inner.split("\n")) {
    lineNumber += 1;
    const line = rawLine.replace(/\r$/, "");
    const trimmed = line.trim();
    // Blank lines and full-line comments neither end the env map nor start
    // one. Inline comments are not stripped, because a value may contain "#"
    // (a URL fragment, for instance).
    if (!trimmed || trimmed.startsWith("#")) continue;

    const colon = trimmed.indexOf(":");
    if (colon <= 0) {
      problem(`not a "key: value" line: "${trimmed}"`);
      continue;
    }
    const key = trimmed.slice(0, colon).trim();
    const value = unquote(trimmed.slice(colon + 1).trim());

    if (/^\s/.test(line)) {
      if (!inEnv) {
        problem(`indented line outside "env:": "${trimmed}"`);
        continue;
      }
      if (!isEnvName(key)) {
        problem(`"env.${key}" is not a usable variable name`);
        continue;
      }
      if (!value) {
        problem(`"env.${key}" has no value`);
        continue;
      }
      params.env[key] = value;
      continue;
    }

    inEnv = false;
    switch (key) {
      case "env":
        if (value) problem(`"env" takes indented NAME: value lines, not an inline value`);
        else inEnv = true;
        break;
      case "cwd":
      case "envFile":
        if (value) params[key] = value;
        else problem(`"${key}" must be a non-empty value`);
        break;
      case "profile":
        if (!value) problem(`"profile" must be a non-empty value`);
        else if (!isProfileName(value)) problem(`"profile" must be letters, digits, "-" or "_": "${value}"`);
        else params.profile = value;
        break;
      case "host": {
        // One line, space- or comma-separated: `host: web1, deploy@prod`.
        // Neither separator can appear in a real ssh destination, so a flat
        // list needs no new grammar. A bad token costs itself, as in `env`:
        // the machines beside it stay reachable.
        if (!value) {
          problem(`"host" must name at least one machine (or "local")`);
          break;
        }
        params.hosts = []; // a repeated host: line replaces, like every other key
        for (const token of value.split(/[,\s]+/)) {
          if (!token) continue;
          if (!isHostName(token)) problem(`"host" entry is not an ssh destination: "${token}"`);
          else if (!params.hosts.includes(token)) params.hosts.push(token);
        }
        break;
      }
      case "tags": {
        // One line, space- or comma-separated, brackets optional:
        // `tags: work, #project/ledge` and `tags: [work, project/ledge]` are
        // the same list (splitTagList/unbracket). A leading "#" on a token is
        // accepted and stripped, so tags can be written the way the body
        // spells them. A bad token costs itself, as in `host`: the tags beside
        // it survive. `tags: []` declares no tags and is no more a problem
        // than omitting the line. A bare `tags:` is an unfinished line, and it
        // is reported.
        if (!value) {
          problem(`"tags" must name at least one tag`);
          break;
        }
        const { accepted, rejected } = splitTagList(value);
        params.tags = accepted.map((a) => a.tag); // a repeated tags: line replaces
        for (const bad of rejected) {
          problem(`"tags" entry is not a tag (letters, digits, "_", "-", "/"): "${bad}"`);
        }
        break;
      }
      case "template":
        // Exactly true, false, or daily. Any other value is reported as a
        // typo rather than defaulting to true. Defaulting would make a note a
        // template without the writer asking for one.
        if (value === "true") params.template = true;
        else if (value === "false") params.template = false;
        else if (value === "daily") params.template = "daily";
        else problem(`"template" must be true, false, or daily: "${value}"`);
        break;
      case "confirm":
        // Exactly true or false. Defaulting a typo to "asks first" would be
        // the harmless direction, but it would also be a silent one, and the
        // key exists so the writer knows which blocks pause.
        if (value === "true") params.confirm = true;
        else if (value === "false") params.confirm = false;
        else problem(`"confirm" must be true or false: "${value}"`);
        break;
      case "favorite":
        // Exactly true or false, `confirm`'s rule. A typo defaulting to true
        // would put a note in the Favorites section nobody put there, and the
        // section is short by design.
        if (value === "true") params.favorite = true;
        else if (value === "false") params.favorite = false;
        else problem(`"favorite" must be true or false: "${value}"`);
        break;
      case "locked":
        // Opaque here; bun/vault.ts owns the structure. A non-empty value
        // marks the note locked even when malformed: the vault then refuses to
        // decrypt a damaged header, where dropping it would leave the parser
        // reporting an unlocked note.
        if (value) params.locked = value;
        else problem(`"locked" is machine-written by Lock This Note: an empty value does nothing`);
        break;
      default:
        // Report the key rather than ignoring it, as parseSettings does. A
        // silently ignored misspelling leaves the writer with frontmatter
        // that does nothing and no reason why.
        problem(`unknown key "${key}"`);
    }
  }

  return { params, problems, end };
}

// Strip one pair of wrapping quotes, so `cwd: "~/My Notes"` means what it
// looks like. Only a matched, wrapping pair: a value that merely contains a
// quote passes through untouched. Exported for the dotenv parsing in
// bun/spawnParams.ts, which quotes by the same rule: a value must mean the
// same thing whether it was written in a note or in a profile file.
export function unquote(v: string): string {
  if (v.length >= 2 && (v[0] === '"' || v[0] === "'") && v[v.length - 1] === v[0]) {
    return v.slice(1, -1);
  }
  return v;
}

// Strip one pair of wrapping brackets, unquote's sibling, so
// `tags: [ops, runbook]` parses as the same list as `tags: ops, runbook`. That
// is YAML's flow sequence, the spelling Obsidian and most Markdown tools use,
// and a notes folder is shared ground (architecture.md §3). This takes
// punctuation off one value and adds no value type to the grammar. A
// multi-line `- item` sequence would add one, so the block still refuses it.
//
// Only a matched, wrapping pair, so `tags: [ops` stays the typo it looks like
// and is reported as one. No bracket can appear inside a tag (isTagToken), so
// a stripped pair was always punctuation. mainview/editor/frontmatter.ts must
// take the brackets off at the same point, or a value the parser accepts would
// render there as two refused tokens.
export function unbracket(v: string): string {
  if (v.length >= 2 && v[0] === "[" && v[v.length - 1] === "]") return v.slice(1, -1);
  return v;
}

// --- line surgery -----------------------------------------------------------
// Two commands write a frontmatter line rather than the writer: Lock This Note
// stamps `locked:` (bun/vault.ts) and Favorite writes `favorite:`
// (bun/notes.ts). Both edit one line and preserve the bytes around it, because
// every other line in the block is the user's.

/**
 * The frontmatter block's lines, split so that surgery can address them.
 * `close` is the closing fence's index into `lines` (the opening fence is
 * index 0), and the content is the lines between them, both fences excluded.
 * `end` is frontmatterEnd's offset. Returns null when the text has no block
 * (frontmatterEnd's definition).
 */
export function blockLines(text: string): { end: number; lines: string[]; close: number } | null {
  const end = frontmatterEnd(text);
  if (end === 0) return null;
  const lines = text.slice(0, end).split("\n");
  for (let i = lines.length - 1; i > 0; i -= 1) {
    if (FENCE.test(lines[i]!)) return { end, lines, close: i };
  }
  return null; // unreachable: frontmatterEnd found a closing fence
}

// A top-level `favorite:` line, never an indented one. An indented one would
// be an env var named "favorite" under `env:`.
const FAVORITE_LINE = /^favorite\s*:/;

/**
 * The note's text with `favorite: true` present or every `favorite:` line
 * gone.
 *
 * Adding writes the line last, after the keys the writer typed, and grows a
 * block on a note that has none. Removing takes the whole block with it when
 * nothing but blank lines is left, so favoriting and unfavoriting a plain note
 * leaves it as it was found. A block still holding comments or other keys is
 * the user's and it stays, the rule stripLockedLine follows.
 *
 * Idempotent in both directions: a note that already reads the asked-for way
 * comes back unchanged, so the caller can skip the write.
 */
export function setFavoriteLine(text: string, on: boolean): string {
  const b = blockLines(text);
  if (!on) {
    if (b === null) return text;
    const content = b.lines.slice(1, b.close);
    const kept = content.filter((l) => !FAVORITE_LINE.test(l));
    if (kept.length === content.length) return text;
    if (kept.every((l) => l.trim() === "")) return text.slice(b.end);
    return [b.lines[0]!, ...kept, ...b.lines.slice(b.close)].join("\n") + text.slice(b.end);
  }
  const line = "favorite: true";
  if (b === null) return `---\n${line}\n---\n${text}`;
  const content = b.lines.slice(1, b.close);
  const at = content.findIndex((l) => FAVORITE_LINE.test(l));
  // Replace where it sits (dropping stray duplicates), so a hand-written
  // `favorite: false` becomes true in place rather than gaining a second line
  // the parser would then have to arbitrate.
  const stamped =
    at === -1
      ? [...content, line]
      : content.map((l, i) => (i === at ? line : l)).filter((l, i) => i === at || !FAVORITE_LINE.test(l));
  if (stamped.join("\n") === content.join("\n")) return text;
  return [b.lines[0]!, ...stamped, ...b.lines.slice(b.close)].join("\n") + text.slice(b.end);
}
