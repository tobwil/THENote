/** AI prompts remain portable Markdown; results are transient until accepted. */
export function parseAiPrompt(text: string): string | null {
  const match = text.match(/^(`{3,}|~{3,})ai[ \t]*\r?\n([\s\S]*?)\r?\n\1[ \t]*$/);
  return match ? match[2] : null;
}
export function serializeAiPrompt(prompt: string) {
  const longest = Math.max(2, ...(prompt.match(/`+/g) ?? []).map(run => run.length));
  const fence = '`'.repeat(longest + 1);
  return `${fence}ai\n${prompt}\n${fence}`;
}
