/**
 * Lightweight fuzzy scoring for command palette and client-side filters.
 * Returns a score in [0, 1]; 0 means no match.
 */
export function normalizeForMatch(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function fuzzyScore(query: string, candidate: string): number {
  const q = normalizeForMatch(query);
  const c = normalizeForMatch(candidate);
  if (!q.length) return 1;
  if (!c.length) return 0;
  if (c.includes(q)) return 0.95;

  let qi = 0;
  for (let ci = 0; ci < c.length && qi < q.length; ci++) {
    if (c[ci] === q[qi]) qi++;
  }
  if (qi < q.length) return 0;

  const density = q.length / c.length;
  return 0.45 + Math.min(0.5, density);
}

export function bestFuzzyScore(query: string, fields: string[]): number {
  let best = 0;
  for (const f of fields) {
    best = Math.max(best, fuzzyScore(query, f));
  }
  return best;
}
