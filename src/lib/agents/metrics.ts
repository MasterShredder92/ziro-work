const metrics: Record<string, number> = {};

function normalizeMetricName(name: string): string | null {
  if (typeof name !== "string") return null;
  const s = name.trim();
  return s.length ? s : null;
}

export function incrementMetric(name: string): void {
  const key = normalizeMetricName(name);
  if (!key) return;
  metrics[key] = (metrics[key] ?? 0) + 1;
}

export function getMetric(name: string): number {
  const key = normalizeMetricName(name);
  if (!key) return 0;
  return metrics[key] ?? 0;
}

export function getAllMetrics(): Record<string, number> {
  return { ...metrics };
}

export function resetMetrics(): void {
  for (const k of Object.keys(metrics)) delete metrics[k];
}

