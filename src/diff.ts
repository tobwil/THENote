export type DiffKind = 'equal' | 'added' | 'removed';
export interface DiffLine { kind: DiffKind; text: string; oldLine: number | null; newLine: number | null }

/** Line diff with a bounded LCS matrix. Large rewrites use one replacement
 * region, retaining common prefix/suffix without blocking the editor. */
export function diffLines(before: string, after: string) {
  const lines = (text: string) => text ? text.replace(/\r\n?/g, '\n').match(/[^\n]*\n|[^\n]+$/g) ?? [] : [];
  const a = lines(before), b = lines(after);
  const result: DiffLine[] = [];
  let oldLine = 1, newLine = 1;
  const emit = (kind: DiffKind, text: string) => result.push({kind, text,
    oldLine: kind === 'added' ? null : oldLine++, newLine: kind === 'removed' ? null : newLine++});
  let start = 0, endA = a.length, endB = b.length;
  while (start < endA && start < endB && a[start] === b[start]) { emit('equal', a[start]); start++; }
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) { endA--; endB--; }
  const n = endA - start, m = endB - start;
  const simplified = n > 0 && m > 0 && (n + 1) * (m + 1) > 2_000_000;
  if (simplified || !n || !m) {
    for (let i = start; i < endA; i++) emit('removed', a[i]);
    for (let j = start; j < endB; j++) emit('added', b[j]);
  } else {
    const width = m + 1, matrix = new Uint32Array((n + 1) * width);
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) {
      matrix[i * width + j] = a[start + i] === b[start + j]
        ? matrix[(i + 1) * width + j + 1] + 1
        : Math.max(matrix[(i + 1) * width + j], matrix[i * width + j + 1]);
    }
    let i = 0, j = 0;
    while (i < n || j < m) {
      if (i < n && j < m && a[start + i] === b[start + j]) { emit('equal', a[start + i++]); j++; }
      else if (i < n && (j === m || matrix[(i + 1) * width + j] >= matrix[i * width + j + 1])) emit('removed', a[start + i++]);
      else emit('added', b[start + j++]);
    }
  }
  for (let i = endA; i < a.length; i++) emit('equal', a[i]);
  return { lines: result, simplified, added: result.filter(l => l.kind === 'added').length,
    removed: result.filter(l => l.kind === 'removed').length };
}

/** Three lines of context around each change; overlapping ranges merge. */
export function diffHunks(lines: DiffLine[], context = 3): DiffLine[][] {
  const ranges: { start: number; end: number }[] = [];
  lines.forEach((line, index) => {
    if (line.kind === 'equal') return;
    const start = Math.max(0, index - context), end = Math.min(lines.length, index + context + 1);
    const last = ranges.at(-1);
    if (last && start <= last.end) last.end = end;
    else ranges.push({start, end});
  });
  return ranges.map(({start, end}) => lines.slice(start, end));
}
