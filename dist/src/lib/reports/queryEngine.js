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
// ---------------------------------------------------------------------------
// Filter / sort primitives
// ---------------------------------------------------------------------------
function coerceNumber(value) {
    if (typeof value === "number")
        return Number.isFinite(value) ? value : null;
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
function compareValues(a, b) {
    if (a === b)
        return 0;
    if (a == null)
        return -1;
    if (b == null)
        return 1;
    if (typeof a === "number" && typeof b === "number")
        return a - b;
    const sa = String(a).toLowerCase();
    const sb = String(b).toLowerCase();
    if (sa < sb)
        return -1;
    if (sa > sb)
        return 1;
    return 0;
}
function applyFilter(row, filter) {
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
            return (typeof value === "string" &&
                typeof filter.value === "string" &&
                value.toLowerCase().includes(filter.value.toLowerCase()));
        case "isNull":
            return value == null;
        case "isNotNull":
            return value != null;
        default:
            return true;
    }
}
function applyFilters(rows, filters) {
    if (!filters || filters.length === 0)
        return rows;
    return rows.filter((row) => filters.every((f) => applyFilter(row, f)));
}
function rangeFilterFor(range) {
    if (!range)
        return [];
    const out = [];
    if (range.from)
        out.push({ field: "created_at", op: "gte", value: `${range.from}T00:00:00Z` });
    if (range.to)
        out.push({ field: "created_at", op: "lte", value: `${range.to}T23:59:59Z` });
    return out;
}
// ---------------------------------------------------------------------------
// Date bucketing
// ---------------------------------------------------------------------------
function toDate(v) {
    if (v instanceof Date)
        return Number.isNaN(v.getTime()) ? null : v;
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
function bucketDate(value, bucket) {
    const d = toDate(value);
    if (!d)
        return null;
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
export function bucketValue(value, bucket) {
    return bucketDate(value, bucket);
}
// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------
function aggregate(rows, spec) {
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
            return values.reduce((acc, v) => { var _a; return acc + ((_a = coerceNumber(v)) !== null && _a !== void 0 ? _a : 0); }, 0);
        case "avg": {
            const nums = values
                .map((v) => coerceNumber(v))
                .filter((n) => n !== null);
            return nums.length > 0
                ? nums.reduce((a, b) => a + b, 0) / nums.length
                : 0;
        }
        case "min": {
            const nums = values
                .map((v) => coerceNumber(v))
                .filter((n) => n !== null);
            return nums.length > 0 ? Math.min(...nums) : 0;
        }
        case "max": {
            const nums = values
                .map((v) => coerceNumber(v))
                .filter((n) => n !== null);
            return nums.length > 0 ? Math.max(...nums) : 0;
        }
        default:
            return 0;
    }
}
// ---------------------------------------------------------------------------
// Group by
// ---------------------------------------------------------------------------
function groupKey(row, groups) {
    return groups
        .map((g) => {
        const raw = row[g.field];
        const bucketed = g.dateBucket ? bucketDate(raw, g.dateBucket) : raw;
        return bucketed == null ? "" : String(bucketed);
    })
        .join("∥");
}
function groupAndAggregate(rows, groups, aggregates) {
    var _a;
    if (groups.length === 0) {
        const out = {};
        for (const agg of aggregates) {
            out[agg.key] = aggregate(rows, agg);
        }
        return [out];
    }
    const buckets = new Map();
    for (const row of rows) {
        const key = groupKey(row, groups);
        if (!buckets.has(key)) {
            const keys = {};
            for (const g of groups) {
                const raw = row[g.field];
                const bucketed = g.dateBucket ? bucketDate(raw, g.dateBucket) : raw;
                keys[(_a = g.alias) !== null && _a !== void 0 ? _a : g.field] = bucketed;
            }
            buckets.set(key, { keys, rows: [] });
        }
        buckets.get(key).rows.push(row);
    }
    return Array.from(buckets.values()).map(({ keys, rows: bucketRows }) => {
        const out = Object.assign({}, keys);
        for (const agg of aggregates) {
            out[agg.key] = aggregate(bucketRows, agg);
        }
        return out;
    });
}
// ---------------------------------------------------------------------------
// Pivot
// ---------------------------------------------------------------------------
function pivotRows(rows, groups, pivot, valueKey) {
    var _a;
    const rowKeyFields = groups.map((g) => { var _a; return (_a = g.alias) !== null && _a !== void 0 ? _a : g.field; });
    const byRowKey = new Map();
    const columnKeys = new Set();
    for (const row of rows) {
        const rowKey = rowKeyFields.map((f) => { var _a; return String((_a = row[f]) !== null && _a !== void 0 ? _a : ""); }).join("∥");
        const col = String((_a = row[pivot.field]) !== null && _a !== void 0 ? _a : "");
        columnKeys.add(col);
        let dest = byRowKey.get(rowKey);
        if (!dest) {
            dest = {};
            for (const f of rowKeyFields)
                dest[f] = row[f];
            byRowKey.set(rowKey, dest);
        }
        dest[col] = row[valueKey];
    }
    for (const dest of byRowKey.values()) {
        for (const col of columnKeys) {
            if (!(col in dest))
                dest[col] = 0;
        }
    }
    return Array.from(byRowKey.values());
}
// ---------------------------------------------------------------------------
// Sort
// ---------------------------------------------------------------------------
function applySort(rows, sort) {
    if (!sort || sort.length === 0)
        return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
        for (const s of sort) {
            const diff = compareValues(a[s.field], b[s.field]);
            if (diff !== 0)
                return s.direction === "desc" ? -diff : diff;
        }
        return 0;
    });
    return copy;
}
// ---------------------------------------------------------------------------
// Joins
// ---------------------------------------------------------------------------
async function applyJoin(rows, join, tenantId) {
    var _a, _b, _c;
    const rightRows = await fetchSource(join.source, tenantId);
    const rightIndex = new Map();
    for (const r of rightRows) {
        const key = String((_a = r[join.on.right]) !== null && _a !== void 0 ? _a : "");
        if (key && !rightIndex.has(key))
            rightIndex.set(key, r);
    }
    const mode = (_b = join.as) !== null && _b !== void 0 ? _b : "left";
    const out = [];
    const prefix = join.alias ? `${join.alias}.` : `${join.source}.`;
    for (const row of rows) {
        const key = String((_c = row[join.on.left]) !== null && _c !== void 0 ? _c : "");
        const match = rightIndex.get(key);
        if (!match && mode === "inner")
            continue;
        const merged = Object.assign({}, row);
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
function applyComputed(rows, computed) {
    if (!computed || computed.length === 0)
        return rows;
    return rows.map((row) => {
        const out = Object.assign({}, row);
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
function evalExpression(expr, row) {
    var _a, _b, _c, _d;
    const pctMatch = expr.match(/^pct\(([^,]+),\s*([^)]+)\)$/);
    if (pctMatch) {
        const a = (_a = coerceNumber(row[pctMatch[1].trim()])) !== null && _a !== void 0 ? _a : 0;
        const b = (_b = coerceNumber(row[pctMatch[2].trim()])) !== null && _b !== void 0 ? _b : 0;
        return b === 0 ? 0 : Math.round((a / b) * 100);
    }
    const ratioMatch = expr.match(/^ratio\(([^,]+),\s*([^)]+)\)$/);
    if (ratioMatch) {
        const a = (_c = coerceNumber(row[ratioMatch[1].trim()])) !== null && _c !== void 0 ? _c : 0;
        const b = (_d = coerceNumber(row[ratioMatch[2].trim()])) !== null && _d !== void 0 ? _d : 0;
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
        }
        catch (_e) {
            return 0;
        }
    }
    return null;
}
// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------
function formatForAggregate(op) {
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
function inferColumns(query, rows) {
    var _a, _b, _c;
    const columns = [];
    const seen = new Set();
    if (query.groupBy) {
        for (const g of query.groupBy) {
            const key = (_a = g.alias) !== null && _a !== void 0 ? _a : g.field;
            if (seen.has(key))
                continue;
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
            if (seen.has(agg.key))
                continue;
            columns.push({
                key: agg.key,
                label: agg.key,
                align: "right",
                format: (_b = agg.format) !== null && _b !== void 0 ? _b : formatForAggregate(agg.op),
            });
            seen.add(agg.key);
        }
    }
    if (query.computed) {
        for (const c of query.computed) {
            if (seen.has(c.key))
                continue;
            columns.push({
                key: c.key,
                label: c.key,
                align: "right",
                format: (_c = c.format) !== null && _c !== void 0 ? _c : "number",
            });
            seen.add(c.key);
        }
    }
    if (columns.length === 0 && rows.length > 0) {
        for (const key of Object.keys(rows[0])) {
            if (seen.has(key))
                continue;
            columns.push({ key, label: key, align: "left", format: "text" });
            seen.add(key);
        }
    }
    return columns;
}
// ---------------------------------------------------------------------------
// Entrypoint
// ---------------------------------------------------------------------------
export async function runQuery(query, tenantId) {
    var _a, _b, _c, _d, _e;
    const started = Date.now();
    let rows = await fetchSource(query.source, tenantId);
    for (const join of (_a = query.join) !== null && _a !== void 0 ? _a : []) {
        rows = await applyJoin(rows, join, tenantId);
    }
    const filters = [...((_b = query.filters) !== null && _b !== void 0 ? _b : []), ...rangeFilterFor(query.range)];
    rows = applyFilters(rows, filters);
    if (query.groupBy && query.groupBy.length > 0) {
        rows = groupAndAggregate(rows, query.groupBy, (_c = query.aggregates) !== null && _c !== void 0 ? _c : []);
    }
    else if (query.aggregates && query.aggregates.length > 0) {
        rows = groupAndAggregate(rows, [], query.aggregates);
    }
    if (query.pivot && query.aggregates && query.aggregates.length > 0) {
        rows = pivotRows(rows, (_d = query.groupBy) !== null && _d !== void 0 ? _d : [], query.pivot, query.pivot.valueKey);
    }
    rows = applyComputed(rows, query.computed);
    rows = applySort(rows, query.sort);
    const totalRows = rows.length;
    const limit = (_e = query.limit) !== null && _e !== void 0 ? _e : 1000;
    if (rows.length > limit)
        rows = rows.slice(0, limit);
    return {
        columns: inferColumns(query, rows),
        rows,
        totalRows,
        executedAt: new Date().toISOString(),
        durationMs: Date.now() - started,
        source: query.source,
    };
}
