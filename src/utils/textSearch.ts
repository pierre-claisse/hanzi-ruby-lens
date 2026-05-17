import type { TextPreview } from "../types/domain";

/**
 * Filters texts whose `title` contains `query` (case-insensitive substring).
 * Empty/whitespace query returns the input unchanged.
 *
 * Results are sorted by the position of the match — earlier matches first.
 * Tied positions preserve the original order.
 */
export function fuzzyFilterTexts(query: string, texts: TextPreview[]): TextPreview[] {
  const q = query.trim().toLowerCase();
  if (q === "") return texts;

  const scored: Array<{ idx: number; pos: number; text: TextPreview }> = [];
  for (let i = 0; i < texts.length; i++) {
    const pos = texts[i].title.toLowerCase().indexOf(q);
    if (pos !== -1) {
      scored.push({ idx: i, pos, text: texts[i] });
    }
  }
  scored.sort((a, b) => {
    if (a.pos !== b.pos) return a.pos - b.pos;
    return a.idx - b.idx;
  });
  return scored.map((s) => s.text);
}
