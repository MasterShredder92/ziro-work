"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { useState } from "react";
export function ContentSearch({ tenantId, initialQuery = "" }) {
    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState([]);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState(null);
    async function runSearch(e) {
        var _a, _b;
        e === null || e === void 0 ? void 0 : e.preventDefault();
        const q = query.trim();
        if (!q) {
            setResults([]);
            return;
        }
        setStatus("pending");
        setError(null);
        try {
            const url = new URL("/content/api/search", window.location.origin);
            url.searchParams.set("tenantId", tenantId);
            url.searchParams.set("q", q);
            const res = await fetch(url.toString());
            if (!res.ok)
                throw new Error(`Search failed (${res.status})`);
            const body = (await res.json());
            setResults((_b = (_a = body.data) === null || _a === void 0 ? void 0 : _a.results) !== null && _b !== void 0 ? _b : []);
            setStatus("idle");
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Search failed");
            setStatus("error");
        }
    }
    return (_jsxs("div", { className: "space-y-3", children: [_jsxs("form", { onSubmit: runSearch, className: "flex gap-2 rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-2", children: [_jsx("input", { value: query, onChange: (e) => setQuery(e.target.value), placeholder: "Search titles, descriptions, tags\u2026", className: "flex-1 rounded-md bg-transparent px-2 py-1.5 text-sm text-[var(--z-fg)] outline-none" }), _jsx("button", { type: "submit", disabled: status === "pending", className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-1.5 text-sm font-semibold text-[var(--z-fg)] hover:text-[#00ff88] disabled:opacity-50", children: status === "pending" ? "Searching…" : "Search" })] }), error ? (_jsx("div", { className: "text-xs text-[var(--z-danger)]", children: error })) : null, results.length > 0 ? (_jsx("ul", { className: "space-y-1.5", children: results.map((r) => (_jsxs("li", { className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx(Link, { href: `/content/${r.item.id}`, className: "text-sm font-semibold text-[var(--z-fg)] hover:text-[#00ff88]", children: r.item.title }), _jsxs("span", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)]", children: ["score ", r.score.toFixed(1)] })] }), r.snippet ? (_jsx("div", { className: "mt-0.5 text-xs text-[var(--z-muted)] line-clamp-2", children: r.snippet })) : null, r.matchedTags.length > 0 ? (_jsxs("div", { className: "mt-1 text-[11px] text-[var(--z-muted)]", children: ["Matched tags: ", r.matchedTags.join(", ")] })) : null] }, r.item.id))) })) : query.trim() && status !== "pending" ? (_jsxs("div", { className: "rounded-[var(--z-radius-md)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-6 text-center text-xs text-[var(--z-muted)]", children: ["No matches for ", _jsx("span", { className: "text-[var(--z-fg)]", children: query })] })) : null] }));
}
