"use client";

import { useState } from "react";
import type {
  AggregateOp,
  FilterOp,
  ReportQuery,
  ReportQueryResult,
  ReportSource,
} from "@/lib/reports/types";
import { PivotTable } from "./charts/PivotTable";

export type ReportBuilderProps = {
  tenantId: string;
  sources: ReportSource[];
};

const AGG_OPS: AggregateOp[] = [
  "count",
  "countDistinct",
  "sum",
  "avg",
  "min",
  "max",
];

const FILTER_OPS: FilterOp[] = [
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "in",
  "notIn",
  "contains",
  "isNull",
  "isNotNull",
];

export function ReportBuilder({ tenantId, sources }: ReportBuilderProps) {
  const [name, setName] = useState("New custom report");
  const [description, setDescription] = useState("");
  const [source, setSource] = useState<ReportSource>(sources[0] ?? "students");
  const [filters, setFilters] = useState<
    { field: string; op: FilterOp; value: string }[]
  >([]);
  const [groupBy, setGroupBy] = useState<string>("");
  const [dateBucket, setDateBucket] = useState<string>("");
  const [aggField, setAggField] = useState<string>("");
  const [aggOp, setAggOp] = useState<AggregateOp>("count");
  const [limit, setLimit] = useState<number>(100);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<ReportQueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const buildQuery = (): ReportQuery => {
    const q: ReportQuery = { source, limit };
    if (filters.length > 0) {
      q.filters = filters
        .filter((f) => f.field.trim())
        .map((f) => ({
          field: f.field.trim(),
          op: f.op,
          value: parseValue(f.value, f.op),
        }));
    }
    if (groupBy.trim()) {
      q.groupBy = [
        {
          field: groupBy.trim(),
          ...(dateBucket
            ? { dateBucket: dateBucket as "day" | "week" | "month" | "quarter" | "year" }
            : {}),
        },
      ];
    }
    if (aggOp) {
      q.aggregates = [
        {
          key: `agg_${aggOp}`,
          op: aggOp,
          ...(aggField.trim() ? { field: aggField.trim() } : {}),
        },
      ];
    }
    return q;
  };

  const onRun = async () => {
    setRunning(true);
    setError(null);
    setSaveMessage(null);
    try {
      const res = await fetch(`/reports/api/query?tenantId=${tenantId}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-tenant-id": tenantId,
        },
        body: JSON.stringify({ query: buildQuery() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Query failed");
      setResult(json.data as ReportQueryResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setRunning(false);
    }
  };

  const onSave = async () => {
    setSaving(true);
    setError(null);
    setSaveMessage(null);
    try {
      const res = await fetch(`/reports/api/catalog?tenantId=${tenantId}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-tenant-id": tenantId,
        },
        body: JSON.stringify({
          name,
          description,
          kind: "custom",
          status: "draft",
          source,
          query: buildQuery(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Save failed");
      setSaveMessage(`Saved as ${json.data?.report?.name ?? name}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <aside className="space-y-4 rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
        <div className="space-y-1">
          <Label>Report name</Label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]"
          />
        </div>
        <div className="space-y-1">
          <Label>Description</Label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]"
          />
        </div>
        <div className="space-y-1">
          <Label>Data source</Label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as ReportSource)}
            className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]"
          >
            {sources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label>Filters</Label>
          {filters.map((f, i) => (
            <div key={i} className="flex gap-1">
              <input
                placeholder="field"
                value={f.field}
                onChange={(e) =>
                  setFilters((prev) =>
                    prev.map((x, j) =>
                      i === j ? { ...x, field: e.target.value } : x,
                    ),
                  )
                }
                className="w-1/3 rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1 text-xs text-[var(--z-fg)]"
              />
              <select
                value={f.op}
                onChange={(e) =>
                  setFilters((prev) =>
                    prev.map((x, j) =>
                      i === j ? { ...x, op: e.target.value as FilterOp } : x,
                    ),
                  )
                }
                className="rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-1 py-1 text-xs text-[var(--z-fg)]"
              >
                {FILTER_OPS.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
              <input
                placeholder="value"
                value={f.value}
                onChange={(e) =>
                  setFilters((prev) =>
                    prev.map((x, j) =>
                      i === j ? { ...x, value: e.target.value } : x,
                    ),
                  )
                }
                className="flex-1 rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1 text-xs text-[var(--z-fg)]"
              />
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => prev.filter((_, j) => j !== i))
                }
                className="rounded-md border border-[var(--z-border)] px-2 text-xs text-[var(--z-muted)]"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setFilters((prev) => [...prev, { field: "", op: "eq", value: "" }])
            }
            className="mt-1 rounded-md border border-dashed border-[var(--z-border)] px-2 py-1 text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]"
          >
            + Add filter
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label>Group by field</Label>
            <input
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              placeholder="e.g. status"
              className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1 text-xs text-[var(--z-fg)]"
            />
          </div>
          <div className="space-y-1">
            <Label>Date bucket</Label>
            <select
              value={dateBucket}
              onChange={(e) => setDateBucket(e.target.value)}
              className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1 text-xs text-[var(--z-fg)]"
            >
              <option value="">—</option>
              <option value="day">day</option>
              <option value="week">week</option>
              <option value="month">month</option>
              <option value="quarter">quarter</option>
              <option value="year">year</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label>Aggregate op</Label>
            <select
              value={aggOp}
              onChange={(e) => setAggOp(e.target.value as AggregateOp)}
              className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1 text-xs text-[var(--z-fg)]"
            >
              {AGG_OPS.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Aggregate field</Label>
            <input
              value={aggField}
              onChange={(e) => setAggField(e.target.value)}
              placeholder="optional"
              className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1 text-xs text-[var(--z-fg)]"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label>Limit</Label>
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value) || 100)}
            className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1 text-xs text-[var(--z-fg)]"
          />
        </div>
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onRun}
            disabled={running}
            className="rounded-md bg-[#00ff88] px-3 py-1.5 text-xs font-semibold text-black hover:bg-[#00e077] disabled:opacity-50"
          >
            {running ? "Running…" : "Run preview"}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || !name.trim()}
            className="rounded-md border border-[var(--z-border)] px-3 py-1.5 text-xs font-semibold text-[var(--z-fg)] hover:bg-white/5 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save report"}
          </button>
        </div>
        {error ? (
          <div className="rounded-md border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-xs text-rose-300">
            {error}
          </div>
        ) : null}
        {saveMessage ? (
          <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
            {saveMessage}
          </div>
        ) : null}
      </aside>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--z-fg)]">Preview</h2>
          {result ? (
            <span className="text-[11px] text-[var(--z-muted)]">
              {result.rows.length} of {result.totalRows} rows · {result.durationMs}ms
            </span>
          ) : null}
        </div>
        {result ? (
          <PivotTable columns={result.columns} rows={result.rows} />
        ) : (
          <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center text-sm text-[var(--z-muted)]">
            Run the query to see a preview.
          </div>
        )}
      </section>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
      {children}
    </div>
  );
}

function parseValue(raw: string, op: FilterOp): unknown {
  if (op === "isNull" || op === "isNotNull") return undefined;
  if (op === "in" || op === "notIn") {
    return raw
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }
  if (raw === "true") return true;
  if (raw === "false") return false;
  const n = Number(raw);
  if (raw !== "" && !Number.isNaN(n)) return n;
  return raw;
}
