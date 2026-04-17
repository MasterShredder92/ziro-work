/**
 * No-op friendly metrics facade.
 *
 * This module exposes a Prometheus-shaped API (counter / gauge / histogram)
 * backed by in-memory maps. On serverless invocations the memory is
 * per-instance and short-lived — this is intentional. The goal is:
 *
 *   1. Give the rest of the codebase a stable API to call.
 *   2. Produce a `/api/metrics` text endpoint in the standard exposition format.
 *   3. Allow a future swap to a real collector (OpenTelemetry, Prometheus
 *      push-gateway, Datadog) without changing call sites.
 *
 * Label cardinality is the caller's responsibility — keep label values bounded.
 */

export type Labels = Record<string, string>;

type CounterState = Map<string, { labels: Labels; value: number }>;
type GaugeState = CounterState;
type HistogramBucket = { le: number; count: number };
type HistogramState = Map<
  string,
  {
    labels: Labels;
    buckets: HistogramBucket[];
    sum: number;
    count: number;
  }
>;

interface Registry {
  counters: Map<string, CounterState>;
  gauges: Map<string, GaugeState>;
  histograms: Map<string, HistogramState>;
}

type GlobalWithRegistry = typeof globalThis & {
  __ziro_metrics_registry?: Registry;
};

const g = globalThis as GlobalWithRegistry;

function getRegistry(): Registry {
  if (!g.__ziro_metrics_registry) {
    g.__ziro_metrics_registry = {
      counters: new Map(),
      gauges: new Map(),
      histograms: new Map(),
    };
  }
  return g.__ziro_metrics_registry;
}

function labelKey(labels: Labels): string {
  const keys = Object.keys(labels).sort();
  if (keys.length === 0) return "";
  return keys.map((k) => `${k}="${String(labels[k]).replace(/"/g, "\\\"")}"`).join(",");
}

const DEFAULT_BUCKETS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

export function incrementCounter(name: string, labels: Labels = {}, delta = 1): void {
  const reg = getRegistry();
  let state = reg.counters.get(name);
  if (!state) {
    state = new Map();
    reg.counters.set(name, state);
  }
  const key = labelKey(labels);
  const current = state.get(key);
  if (current) current.value += delta;
  else state.set(key, { labels: { ...labels }, value: delta });
}

export function setGauge(name: string, value: number, labels: Labels = {}): void {
  const reg = getRegistry();
  let state = reg.gauges.get(name);
  if (!state) {
    state = new Map();
    reg.gauges.set(name, state);
  }
  const key = labelKey(labels);
  state.set(key, { labels: { ...labels }, value });
}

export function observeHistogram(
  name: string,
  value: number,
  labels: Labels = {},
  buckets: number[] = DEFAULT_BUCKETS,
): void {
  const reg = getRegistry();
  let state = reg.histograms.get(name);
  if (!state) {
    state = new Map();
    reg.histograms.set(name, state);
  }
  const key = labelKey(labels);
  let entry = state.get(key);
  if (!entry) {
    entry = {
      labels: { ...labels },
      buckets: buckets.map((le) => ({ le, count: 0 })),
      sum: 0,
      count: 0,
    };
    state.set(key, entry);
  }
  entry.sum += value;
  entry.count += 1;
  for (const b of entry.buckets) {
    if (value <= b.le) b.count += 1;
  }
}

/** Time an async function and record its duration in ms as a histogram observation. */
export async function timeAsync<T>(
  name: string,
  fn: () => Promise<T>,
  labels: Labels = {},
): Promise<T> {
  const started = Date.now();
  try {
    const out = await fn();
    observeHistogram(name, Date.now() - started, { ...labels, outcome: "ok" });
    return out;
  } catch (err) {
    observeHistogram(name, Date.now() - started, { ...labels, outcome: "error" });
    throw err;
  }
}

export interface MetricSnapshot {
  counters: Array<{ name: string; labels: Labels; value: number }>;
  gauges: Array<{ name: string; labels: Labels; value: number }>;
  histograms: Array<{
    name: string;
    labels: Labels;
    buckets: HistogramBucket[];
    sum: number;
    count: number;
  }>;
}

export function snapshot(): MetricSnapshot {
  const reg = getRegistry();
  const counters: MetricSnapshot["counters"] = [];
  for (const [name, state] of reg.counters) {
    for (const { labels, value } of state.values()) counters.push({ name, labels, value });
  }
  const gauges: MetricSnapshot["gauges"] = [];
  for (const [name, state] of reg.gauges) {
    for (const { labels, value } of state.values()) gauges.push({ name, labels, value });
  }
  const histograms: MetricSnapshot["histograms"] = [];
  for (const [name, state] of reg.histograms) {
    for (const entry of state.values())
      histograms.push({
        name,
        labels: entry.labels,
        buckets: entry.buckets,
        sum: entry.sum,
        count: entry.count,
      });
  }
  return { counters, gauges, histograms };
}

function renderLabels(labels: Labels): string {
  const key = labelKey(labels);
  return key ? `{${key}}` : "";
}

/** Prometheus text-format exposition (v0.0.4). */
export function renderPrometheus(): string {
  const snap = snapshot();
  const lines: string[] = [];
  const namesEmitted = new Set<string>();

  for (const c of snap.counters) {
    if (!namesEmitted.has(c.name)) {
      lines.push(`# TYPE ${c.name} counter`);
      namesEmitted.add(c.name);
    }
    lines.push(`${c.name}${renderLabels(c.labels)} ${c.value}`);
  }
  for (const gauge of snap.gauges) {
    if (!namesEmitted.has(gauge.name)) {
      lines.push(`# TYPE ${gauge.name} gauge`);
      namesEmitted.add(gauge.name);
    }
    lines.push(`${gauge.name}${renderLabels(gauge.labels)} ${gauge.value}`);
  }
  for (const h of snap.histograms) {
    if (!namesEmitted.has(h.name)) {
      lines.push(`# TYPE ${h.name} histogram`);
      namesEmitted.add(h.name);
    }
    for (const b of h.buckets) {
      lines.push(
        `${h.name}_bucket${renderLabels({ ...h.labels, le: String(b.le) })} ${b.count}`,
      );
    }
    lines.push(`${h.name}_sum${renderLabels(h.labels)} ${h.sum}`);
    lines.push(`${h.name}_count${renderLabels(h.labels)} ${h.count}`);
  }
  return lines.join("\n") + (lines.length ? "\n" : "");
}

/** Reset the registry. Test-only — do not call in production code paths. */
export function _resetMetricsForTests(): void {
  g.__ziro_metrics_registry = undefined;
}
