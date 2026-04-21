"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
function formatTs(iso) {
    try {
        return new Date(iso).toLocaleString();
    }
    catch (_a) {
        return iso;
    }
}
export function AuditLogTable({ entries, tenantId }) {
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");
    const [selected, setSelected] = useState(null);
    const categories = useMemo(() => Array.from(new Set(entries.map((e) => e.category).filter((c) => !!c))).sort(), [entries]);
    const rows = useMemo(() => {
        const lower = search.trim().toLowerCase();
        return entries.filter((e) => {
            var _a, _b, _c;
            if (category && e.category !== category)
                return false;
            if (!lower)
                return true;
            const hay = `${e.event} ${(_a = e.actor_id) !== null && _a !== void 0 ? _a : ""} ${(_b = e.target_type) !== null && _b !== void 0 ? _b : ""} ${(_c = e.target_id) !== null && _c !== void 0 ? _c : ""}`.toLowerCase();
            return hay.includes(lower);
        });
    }, [entries, search, category]);
    const exportHref = `/api/admin/audit?tenantId=${encodeURIComponent(tenantId)}&format=csv`;
    return (_jsxs("div", { className: "flex flex-col gap-3", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx("input", { type: "search", value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Search events\u2026", className: "h-9 w-full max-w-sm rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-sm" }), _jsxs("select", { value: category, onChange: (e) => setCategory(e.target.value), className: "h-9 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-sm", children: [_jsx("option", { value: "", children: "All categories" }), categories.map((c) => (_jsx("option", { value: c, children: c }, c)))] }), _jsx("a", { href: exportHref, className: "ml-auto h-9 rounded-[var(--z-radius-md)] border border-[var(--z-border)] px-3 text-sm leading-9 text-[var(--z-fg)] hover:bg-white/5", children: "Export CSV" })] }), _jsx("div", { className: "overflow-auto rounded-[var(--z-radius-md)] border border-[var(--z-border)]", children: _jsxs("table", { className: "min-w-full border-collapse text-sm", children: [_jsx("thead", { className: "bg-[var(--z-surface)] text-left text-[var(--z-muted)]", children: _jsxs("tr", { children: [_jsx("th", { className: "px-3 py-2", children: "When" }), _jsx("th", { className: "px-3 py-2", children: "Event" }), _jsx("th", { className: "px-3 py-2", children: "Category" }), _jsx("th", { className: "px-3 py-2", children: "Actor" }), _jsx("th", { className: "px-3 py-2", children: "Target" }), _jsx("th", { className: "px-3 py-2" })] }) }), _jsxs("tbody", { children: [rows.map((row) => {
                                    var _a, _b, _c;
                                    return (_jsxs("tr", { className: "border-t border-[var(--z-border)] hover:bg-white/5", children: [_jsx("td", { className: "px-3 py-2 font-mono text-xs text-[var(--z-muted)]", children: formatTs(row.created_at) }), _jsx("td", { className: "px-3 py-2 font-mono text-xs", children: row.event }), _jsx("td", { className: "px-3 py-2 text-xs", children: (_a = row.category) !== null && _a !== void 0 ? _a : "—" }), _jsxs("td", { className: "px-3 py-2 font-mono text-xs", children: [(_b = row.actor_id) !== null && _b !== void 0 ? _b : "system", row.actor_role ? (_jsx("span", { className: "ml-2 text-[var(--z-muted)]", children: row.actor_role })) : null] }), _jsxs("td", { className: "px-3 py-2 font-mono text-xs", children: [(_c = row.target_type) !== null && _c !== void 0 ? _c : "—", row.target_id ? (_jsx("span", { className: "ml-1 text-[var(--z-muted)]", children: row.target_id })) : null] }), _jsx("td", { className: "px-3 py-2 text-right", children: _jsx("button", { type: "button", onClick: () => setSelected(row), className: "text-xs text-[var(--z-accent)] hover:underline", children: "View" }) })] }, row.id));
                                }), rows.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "px-3 py-6 text-center text-[var(--z-muted)]", children: "No audit events match your filter." }) })) : null] })] }) }), selected ? (_jsxs("div", { className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-3", children: [_jsxs("div", { className: "mb-2 flex items-center justify-between", children: [_jsx("div", { className: "font-mono text-sm", children: selected.event }), _jsx("button", { type: "button", onClick: () => setSelected(null), className: "text-xs text-[var(--z-muted)] hover:underline", children: "Close" })] }), _jsx("pre", { className: "max-h-[400px] overflow-auto text-xs text-[var(--z-fg)]", children: JSON.stringify({
                            before: selected.before,
                            after: selected.after,
                            diff: selected.diff,
                            payload: selected.payload,
                        }, null, 2) })] })) : null] }));
}
