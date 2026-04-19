export const SERIES_COLORS = [
  "#00ff88",
  "#00b0ff",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#14b8a6",
  "#f472b6",
  "#eab308",
] as const;

export type SeriesPoint = { x: string | number; y: number; label?: string };
export type Series = { id: string; label: string; data: SeriesPoint[] };

export function collectLabels(series: Series[]): string[] {
  const set = new Set<string>();
  for (const s of series) for (const p of s.data) set.add(String(p.x));
  return Array.from(set);
}

export function maxY(series: Series[]): number {
  let m = 0;
  for (const s of series) {
    for (const p of s.data) {
      if (p.y > m) m = p.y;
    }
  }
  return m || 1;
}

export function colorFor(i: number): string {
  return SERIES_COLORS[i % SERIES_COLORS.length];
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "—";
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(1)}k`;
  }
  return String(Math.round(value * 100) / 100);
}
