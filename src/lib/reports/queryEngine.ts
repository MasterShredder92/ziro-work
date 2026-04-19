/**
 * Reporting OS — unified query engine.
 *
 * Operates on arrays of records returned from @data/* facades. Supports
 * filtering, date bucketing, group-by / aggregate, pivot, sort, and
 * tenant-safe left joins across report sources.
 *
 * Designed for small-to-medium datasets (< ~5k rows). For larger datasets
 * the facade layer should push aggregates down to Postgres.
 */

import "server-only";

import { fetchSource } from "./sources";
import type {
  AggregateOp,
  DateBucket,
  ReportAggregate,
  ReportColumn,
  ReportColumnFormat,
  ReportFilter,
  ReportGroupBy,
  ReportJoin,
  ReportPivot,
  ReportQuery,
  ReportQueryResult,
  ReportSort,
} from "./types";

type Row = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Filter / sort primitives
// ---------------------------------------------------------------------------

function coerceNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  if (value instanceof Date) {
    const t = value.getTime();
    return Number.isFinite(t) ? t : null;
  }
  return null;
}

function compareValues(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  const sa = String(a).toLowerCase();
  const sb = String(b).toLowerCase();
  if (sa < sb) return -1;
  if (sa > sb) return 1;
  return 0;
}

function applyFilter(row: Row, filter: ReportFilter): boolean {
  const value = row[filter.field];
  switch (filter.op) {
    case "eq":
      return value === filter.value;
    case "neq":
      return value !== filter.value;
    case "gt":
      return compareValues(value, filter.value) > 0;
    case "gte":
      return compareValues(value, filter.value) >= 0;
    case "lt":
      return compareValues(value, filter.value) < 0;
    case "lte":
      return compareValues(value, filter.value) <= 0;
    case "in":
      return Array.isArray(filter.value) && filter.value.includes(value);
    case "notIn":
      return Array.isArray(filter.value) && !filter.value.includes(value);
    case "contains":
      return (
        typeof value === "string" &&
        typeof filter.value === "string" &&
        value.toLowerCase().includes(filter.value.toLowerCase())
      );
    case "isNull":
      return value == null;
    case "isNotNull":
      return value != null;
    default:
      return true;
  }
}

function applyFilters(rows: Row[], filters: ReportFilter[] | undefined): Row[] {
  if (!filters || filters.length === 0) return rows;
  return rows.filter((row) => filters.every((f) => applyFilter(row, f)));
}

function rangeFilterFor(range?: { from?: string; to?: string }): ReportFilter[] {
  if (!range) return [];
  const out: ReportFilter[] = [];
  if (range.from) out.push({ field: "created_at", op: "gte", value: `${range.from}T00:00:00Z` });
  if (range.to) out.push({ field: "created_at", op: "lte", value: `${range.to}T23:59:59Z` });
  return out;
}

// ---------------------------------------------------------------------------
// Date bucketing
// ---------------------------------------------------------------------------

function toDate(v: unknown): Date | null {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v === "string") {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof v === "number") {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function bucketDate(value: unknown, bucket: DateBucket): string | null {
  const d = toDate(value);
  if (!d) return null;
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  switch (bucket) {
    case "day":
      return d.toISOString().slice(0, 10);
    case "week": {
      const day = d.getUTCDay();
      const monday = new Date(d);
      monday.setUTCDate(d.getUTCDate() - ((day + 6) % 7));
      return monday.toISOString().slice(0, 10);
    }
    case "month":
      return `${y}-${String(m + 1).padStart(2, "0")}`;
    case "quarter":
      return `${y}-Q${Math.floor(m / 3) + 1}`;
    case "year":
      return String(y);
    default:
      return d.toISOString().slice(0, 10);
  }
}

export function bucketValue(value: unknown, bucket: DateBucket): string | null {
  return bucketDate(value, bucket);
}

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------

function aggregate(rows: Row[], spec: ReportAggregate): number {
  const field = spec.field;
  const values = field ? rows.map((r) => r[field]) : rows.map(() => 1);
  switch (spec.op) {
    case "count":
      return field
        ? values.filter((v) => v != null && v !== "").length
        : rows.length;
    case "countDistinct":
      return new Set(values.filter((v) => v != null && v !== "")).size;
    case "sum":
      return values.reduce<number>((acc, v) => acc + (coerceNumber(v) ?? 0), 0);
    case "avg": {
      const nums = values
        .map((v) => coerceNumber(v))
        .filter((n): n is number => n !== null);
      return nums.length > 0
        ? nums.reduce((a, b) => a + b, 0) / nums.length
        : 0;
    }
    case "min": {
      const nums = values
        .map((v) => coerceNumber(v))
        .filter((n): n is number => n !== null);
      return nums.length > 0 ? Math.min(...nums) : 0;
    }
    case "max": {
      const nums = values
        .map((v) => coerceNumber(v))
        .filter((n): n is number => n !== null);
      return nums.length > 0 ? Math.max(...nums) : 0;
    }
    default:
      return 0;
  }
}

// ---------------------------------------------------------------------------
// Group by
// ---------------------------------------------------------------------------

function groupKey(row: Row, groups: ReportGroupBy[]): string {
  return groups
    .map((g) => {
      const raw = row[g.field];
      const bucketed = g.dateBucket ? bucketDate(raw, g.dateBucket) : raw;
      return bucketed == null ? "" : String(bucketed);
    })
    .join("∥");
}

function groupAndAggregate(
  rows: Row[],
  groups: ReportGroupBy[],
  aggregates: ReportAggregate[],
): Row[] {
  if (groups.length === 0) {
    const out: Row = {};
    for (const agg of aggregates) {
      out[agg.key] = aggregate(rows, agg);
    }
    return [out];
  }
  const buckets = new Map<string, { keys: Row; rows: Row[] }>();
  for (const row of rows) {
    const key = groupKey(row, groups);
    if (!buckets.has(key)) {
      const keys: Row = {};
      for (const g of groups) {
        const raw = row[g.field];
        const bucketed = g.dateBucket ? bucketDate(raw, g.dateBucket) : raw;
        keys[g.alias ?? g.field] = bucketed;
      }
      buckets.set(key, { keys, rows: [] });
    }
    buckets.get(key)!.rows.push(row);
  }
  return Array.from(buckets.values()).map(({ keys, rows: bucketRows }) => {
    const out: Row = { ...keys };
    for (const agg of aggregates) {
      out[agg.key] = aggregate(bucketRows, agg);
    }
    return out;
  });
}

// ---------------------------------------------------------------------------
// Pivot
// ---------------------------------------------------------------------------

function pivotRows(
  rows: Row[],
  groups: ReportGroupBy[],
  pivot: ReportPivot,
  valueKey: string,
): Row[] {
  const rowKeyFields = groups.map((g) => g.alias ?? g.field);
  const byRowKey = new Map<string, Row>();
  const columnKeys = new Set<string>();
  for (const row of rows) {
    const rowKey = rowKeyFields.map((f) => String(row[f] ?? "")).join("∥");
    const col = String(row[pivot.field] ?? "");
    columnKeys.add(col);
    let dest = byRowKey.get(rowKey);
    if (!dest) {
      dest = {};
      for (const f of rowKeyFields) dest[f] = row[f];
      byRowKey.set(rowKey, dest);
    }
    dest[col] = row[valueKey];
  }
  for (const dest of byRowKey.values()) {
    for (const col of columnKeys) {
      if (!(col in dest)) dest[col] = 0;
    }
  }
  return Array.from(byRowKey.values());
}

// ---------------------------------------------------------------------------
// Sort
// ---------------------------------------------------------------------------

function applySort(rows: Row[], sort: ReportSort[] | undefined): Row[] {
  if (!sort || sort.length === 0) return rows;
  const copy = [...rows];
  copy.sort((a, b) => {
    for (const s of sort) {
      const diff = compareValues(a[s.field], b[s.field]);
      if (diff !== 0) return s.direction === "desc" ? -diff : diff;
    }
    return 0;
  });
  return copy;
}

// ---------------------------------------------------------------------------
// Joins
// ---------------------------------------------------------------------------

async function applyJoin(
  rows: Row[],
  join: ReportJoin,
  tenantId: string,
): Promise<Row[]> {
  const rightRows = await fetchSource(join.source, tenantId);
  const rightIndex = new Map<string, Row>();
  for (const r of rightRows) {
    const key = String(r[join.on.right] ?? "");
    if (key && !rightIndex.has(key)) rightIndex.set(key, r);
  }
  const mode = join.as ?? "left";
  const out: Row[] = [];
  const prefix = join.alias ? `${join.alias}.` : `${join.source}.`;
  for (const row of rows) {
    const key = String(row[join.on.left] ?? "");
    const match = rightIndex.get(key);
    if (!match && mode === "inner") continue;
    const merged: Row = { ...row };
    if (match) {
      for (const [k, v] of Object.entries(match)) {
        merged[`${prefix}${k}`] = v;
      }
    }
    out.push(merged);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Computed fields
// ---------------------------------------------------------------------------

function applyComputed(
  rows: Row[],
  computed: ReportQuery["computed"],
): Row[] {
  if (!computed || computed.length === 0) return rows;
  return rows.map((row) => {
    const out: Row = { ...row };
    for (const c of computed) {
      out[c.key] = evalExpression(c.expression, row);
    }
    return out;
  });
}

/**
 * Evaluates a whitelisted, extremely small expression language:
 *   - field references: `fieldName`
 *   - numeric literals, +, -, *, /, parentheses
 *   - safe percentage: `pct(num, denom)`, `ratio(num, denom)`
 */
function evalExpression(expr: string, row: Row): number | string | null {
  const pctMatch = expr.match(/^pct\(([^,]+),\s*([^)]+)\)$/);
  if (pctMatch) {
    const a = coerceNumber(row[pctMatch[1].trim()]) ?? 0;
    const b = coerceNumber(row[pctMatch[2].trim()]) ?? 0;
    return b === 0 ? 0 : Math.round((a / b) * 100);
  }
  const ratioMatch = expr.match(/^ratio\(([^,]+),\s*([^)]+)\)$/);
  if (ratioMatch) {
    const a = coerceNumber(row[ratioMatch[1].trim()]) ?? 0;
    const b = coerceNumber(row[ratioMatch[2].trim()]) ?? 0;
    return b === 0 ? 0 : a / b;
  }
  if (/^[0-9a-z_+\-*/().\s]+$/i.test(expr)) {
    const replaced = expr.replace(/[a-z_][a-z_0-9]*/gi, (name) => {
      const v = coerceNumber(row[name]);
      return v === null ? "0" : String(v);
    });
    try {
      const fn = new Function(`return (${replaced});`);
      const v = fn();
      return typeof v === "number" && Number.isFinite(v) ? v : 0;
    } catch {
      return 0;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------

function formatForAggregate(op: AggregateOp): ReportColumnFormat {
  switch (op) {
    case "count":
    case "countDistinct":
      return "number";
    case "avg":
    case "sum":
    case "min":
    case "max":
      return "number";
    default:
      return "number";
  }
}

function inferColumns(
  query: ReportQuery,
  rows: Row[],
): ReportColumn[] {
  const columns: ReportColumn[] = [];
  const seen = new Set<string>();

  if (query.groupBy) {
    for (const g of query.groupBy) {
      const key = g.alias ?? g.field;
      if (seen.has(key)) continue;
      columns.push({
        key,
        label: key,
        align: "left",
        format: g.dateBucket ? "text" : "text",
      });
      seen.add(key);
    }
  }
  if (query.aggregates) {
    for (const agg of query.aggregates) {
      if (seen.has(agg.key)) continue;
      columns.push({
        key: agg.key,
        label: agg.key,
        align: "right",
        format: agg.format ?? formatForAggregate(agg.op),
      });
      seen.add(agg.key);
    }
  }
  if (query.computed) {
    for (const c of query.computed) {
      if (seen.has(c.key)) continue;
      columns.push({
        key: c.key,
        label: c.key,
        align: "right",
        format: c.format ?? "number",
      });
      seen.add(c.key);
    }
  }
  if (columns.length === 0 && rows.length > 0) {
    for (const key of Object.keys(rows[0])) {
      if (seen.has(key)) continue;
      columns.push({ key, label: key, align: "left", format: "text" });
      seen.add(key);
    }
  }
  return columns;
}

// ---------------------------------------------------------------------------
// Entrypoint
// ---------------------------------------------------------------------------

export async function runQuery(
  query: ReportQuery,
  tenantId: string,
): Promise<ReportQueryResult> {
  const started = Date.now();
  let rows = await fetchSource(query.source, tenantId);

  for (const join of query.join ?? []) {
    rows = await applyJoin(rows, join, tenantId);
  }

  const filters = [...(query.filters ?? []), ...rangeFilterFor(query.range)];
  rows = applyFilters(rows, filters);

  if (query.groupBy && query.groupBy.length > 0) {
    rows = groupAndAggregate(rows, query.groupBy, query.aggregates ?? []);
  } else if (query.aggregates && query.aggregates.length > 0) {
    rows = groupAndAggregate(rows, [], query.aggregates);
  }

  if (query.pivot && query.aggregates && query.aggregates.length > 0) {
    rows = pivotRows(
      rows,
      query.groupBy ?? [],
      query.pivot,
      query.pivot.valueKey,
    );
  }

  rows = applyComputed(rows, query.computed);
  rows = applySort(rows, query.sort);

  const totalRows = rows.length;
  const limit = query.limit ?? 1000;
  if (rows.length > limit) rows = rows.slice(0, limit);

  return {
    columns: inferColumns(query, rows),
    rows,
    totalRows,
    executedAt: new Date().toISOString(),
    durationMs: Date.now() - started,
    source: query.source,
  };
}
