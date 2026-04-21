"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { PivotTable } from "./charts/PivotTable";
const AGG_OPS = [
    "count",
    "countDistinct",
    "sum",
    "avg",
    "min",
    "max",
];
const FILTER_OPS = [
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
export function ReportBuilder({ tenantId, sources }) {
    var _a;
    const [name, setName] = useState("New custom report");
    const [description, setDescription] = useState("");
    const [source, setSource] = useState((_a = sources[0]) !== null && _a !== void 0 ? _a : "students");
    const [filters, setFilters] = useState([]);
    const [groupBy, setGroupBy] = useState("");
    const [dateBucket, setDateBucket] = useState("");
    const [aggField, setAggField] = useState("");
    const [aggOp, setAggOp] = useState("count");
    const [limit, setLimit] = useState(100);
    const [running, setRunning] = useState(false);
    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [saveMessage, setSaveMessage] = useState(null);
    const buildQuery = () => {
        const q = { source, limit };
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
                Object.assign({ field: groupBy.trim() }, (dateBucket
                    ? { dateBucket: dateBucket }
                    : {})),
            ];
        }
        if (aggOp) {
            q.aggregates = [
                Object.assign({ key: `agg_${aggOp}`, op: aggOp }, (aggField.trim() ? { field: aggField.trim() } : {})),
            ];
        }
        return q;
    };
    const onRun = async () => {
        var _a;
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
            if (!res.ok)
                throw new Error((_a = json === null || json === void 0 ? void 0 : json.error) !== null && _a !== void 0 ? _a : "Query failed");
            setResult(json.data);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Query failed");
        }
        finally {
            setRunning(false);
        }
    };
    const onSave = async () => {
        var _a, _b, _c, _d;
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
            if (!res.ok)
                throw new Error((_a = json === null || json === void 0 ? void 0 : json.error) !== null && _a !== void 0 ? _a : "Save failed");
            setSaveMessage(`Saved as ${(_d = (_c = (_b = json.data) === null || _b === void 0 ? void 0 : _b.report) === null || _c === void 0 ? void 0 : _c.name) !== null && _d !== void 0 ? _d : name}.`);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Save failed");
        }
        finally {
            setSaving(false);
        }
    };
    return (_jsxs("div", { className: "grid gap-6 lg:grid-cols-[360px_1fr]", children: [_jsxs("aside", { className: "space-y-4 rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { children: "Report name" }), _jsx("input", { value: name, onChange: (e) => setName(e.target.value), className: "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]" })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { children: "Description" }), _jsx("textarea", { value: description, onChange: (e) => setDescription(e.target.value), rows: 2, className: "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]" })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { children: "Data source" }), _jsx("select", { value: source, onChange: (e) => setSource(e.target.value), className: "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]", children: sources.map((s) => (_jsx("option", { value: s, children: s }, s))) })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { children: "Filters" }), filters.map((f, i) => (_jsxs("div", { className: "flex gap-1", children: [_jsx("input", { placeholder: "field", value: f.field, onChange: (e) => setFilters((prev) => prev.map((x, j) => i === j ? Object.assign(Object.assign({}, x), { field: e.target.value }) : x)), className: "w-1/3 rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1 text-xs text-[var(--z-fg)]" }), _jsx("select", { value: f.op, onChange: (e) => setFilters((prev) => prev.map((x, j) => i === j ? Object.assign(Object.assign({}, x), { op: e.target.value }) : x)), className: "rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-1 py-1 text-xs text-[var(--z-fg)]", children: FILTER_OPS.map((op) => (_jsx("option", { value: op, children: op }, op))) }), _jsx("input", { placeholder: "value", value: f.value, onChange: (e) => setFilters((prev) => prev.map((x, j) => i === j ? Object.assign(Object.assign({}, x), { value: e.target.value }) : x)), className: "flex-1 rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1 text-xs text-[var(--z-fg)]" }), _jsx("button", { type: "button", onClick: () => setFilters((prev) => prev.filter((_, j) => j !== i)), className: "rounded-md border border-[var(--z-border)] px-2 text-xs text-[var(--z-muted)]", children: "\u00D7" })] }, i))), _jsx("button", { type: "button", onClick: () => setFilters((prev) => [...prev, { field: "", op: "eq", value: "" }]), className: "mt-1 rounded-md border border-dashed border-[var(--z-border)] px-2 py-1 text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]", children: "+ Add filter" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { children: "Group by field" }), _jsx("input", { value: groupBy, onChange: (e) => setGroupBy(e.target.value), placeholder: "e.g. status", className: "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1 text-xs text-[var(--z-fg)]" })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { children: "Date bucket" }), _jsxs("select", { value: dateBucket, onChange: (e) => setDateBucket(e.target.value), className: "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1 text-xs text-[var(--z-fg)]", children: [_jsx("option", { value: "", children: "\u2014" }), _jsx("option", { value: "day", children: "day" }), _jsx("option", { value: "week", children: "week" }), _jsx("option", { value: "month", children: "month" }), _jsx("option", { value: "quarter", children: "quarter" }), _jsx("option", { value: "year", children: "year" })] })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { children: "Aggregate op" }), _jsx("select", { value: aggOp, onChange: (e) => setAggOp(e.target.value), className: "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1 text-xs text-[var(--z-fg)]", children: AGG_OPS.map((op) => (_jsx("option", { value: op, children: op }, op))) })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { children: "Aggregate field" }), _jsx("input", { value: aggField, onChange: (e) => setAggField(e.target.value), placeholder: "optional", className: "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1 text-xs text-[var(--z-fg)]" })] })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { children: "Limit" }), _jsx("input", { type: "number", value: limit, onChange: (e) => setLimit(Number(e.target.value) || 100), className: "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1 text-xs text-[var(--z-fg)]" })] }), _jsxs("div", { className: "flex items-center gap-2 pt-2", children: [_jsx("button", { type: "button", onClick: onRun, disabled: running, className: "rounded-md bg-[#00ff88] px-3 py-1.5 text-xs font-semibold text-black hover:bg-[#00e077] disabled:opacity-50", children: running ? "Running…" : "Run preview" }), _jsx("button", { type: "button", onClick: onSave, disabled: saving || !name.trim(), className: "rounded-md border border-[var(--z-border)] px-3 py-1.5 text-xs font-semibold text-[var(--z-fg)] hover:bg-white/5 disabled:opacity-50", children: saving ? "Saving…" : "Save report" })] }), error ? (_jsx("div", { className: "rounded-md border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-xs text-rose-300", children: error })) : null, saveMessage ? (_jsx("div", { className: "rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300", children: saveMessage })) : null] }), _jsxs("section", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Preview" }), result ? (_jsxs("span", { className: "text-[11px] text-[var(--z-muted)]", children: [result.rows.length, " of ", result.totalRows, " rows \u00B7 ", result.durationMs, "ms"] })) : null] }), result ? (_jsx(PivotTable, { columns: result.columns, rows: result.rows })) : (_jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center text-sm text-[var(--z-muted)]", children: "Run the query to see a preview." }))] })] }));
}
function Label({ children }) {
    return (_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: children }));
}
function parseValue(raw, op) {
    if (op === "isNull" || op === "isNotNull")
        return undefined;
    if (op === "in" || op === "notIn") {
        return raw
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean);
    }
    if (raw === "true")
        return true;
    if (raw === "false")
        return false;
    const n = Number(raw);
    if (raw !== "" && !Number.isNaN(n))
        return n;
    return raw;
}
