"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { useMemo, useState } from "react";
import { TEMPLATE_CATEGORIES, TEMPLATE_CHANNELS, } from "@/lib/templates/types";
function relativeDate(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime()))
        return iso;
    const diff = Date.now() - d.getTime();
    const day = 1000 * 60 * 60 * 24;
    if (diff < day)
        return "today";
    if (diff < day * 2)
        return "yesterday";
    const days = Math.floor(diff / day);
    if (days < 30)
        return `${days}d ago`;
    return d.toLocaleDateString();
}
export function TemplateList({ templates, emptyLabel = "No templates yet. Create your first template to get started.", }) {
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("");
    const [channel, setChannel] = useState("");
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return templates.filter((t) => {
            var _a, _b, _c;
            if (category && t.category !== category)
                return false;
            if (channel && t.channel !== channel)
                return false;
            if (!q)
                return true;
            return (t.name.toLowerCase().includes(q) ||
                ((_a = t.description) !== null && _a !== void 0 ? _a : "").toLowerCase().includes(q) ||
                ((_b = t.subject) !== null && _b !== void 0 ? _b : "").toLowerCase().includes(q) ||
                ((_c = t.slug) !== null && _c !== void 0 ? _c : "").toLowerCase().includes(q));
        });
    }, [templates, query, category, channel]);
    return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx("input", { type: "search", value: query, onChange: (e) => setQuery(e.target.value), placeholder: "Search templates\u2026", className: "h-9 flex-1 min-w-[160px] rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-sm text-[var(--z-fg)]" }), _jsxs("select", { value: category, onChange: (e) => setCategory(e.target.value), className: "h-9 rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] px-2 text-sm text-[var(--z-fg)]", "aria-label": "Filter category", children: [_jsx("option", { value: "", children: "All categories" }), TEMPLATE_CATEGORIES.map((c) => (_jsx("option", { value: c, children: c }, c)))] }), _jsxs("select", { value: channel, onChange: (e) => setChannel(e.target.value), className: "h-9 rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] px-2 text-sm text-[var(--z-fg)]", "aria-label": "Filter channel", children: [_jsx("option", { value: "", children: "All channels" }), TEMPLATE_CHANNELS.map((c) => (_jsx("option", { value: c, children: c }, c)))] }), _jsx(Link, { href: "/templates/new", className: "h-9 rounded-md border border-[color-mix(in_oklab,var(--z-accent),transparent_40%)] bg-[color-mix(in_oklab,var(--z-accent),transparent_85%)] px-3 text-sm font-semibold text-[var(--z-accent)] leading-9", children: "New template" })] }), filtered.length === 0 ? (_jsx("div", { className: "rounded-md border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]", children: templates.length === 0 ? emptyLabel : "No templates match your filters." })) : (_jsx("div", { className: "overflow-hidden rounded-md border border-[var(--z-border)] bg-[var(--z-surface)]", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-[color-mix(in_oklab,var(--z-surface),black_3%)] text-left text-xs uppercase tracking-wider text-[var(--z-muted)]", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-2 font-semibold", children: "Name" }), _jsx("th", { className: "px-4 py-2 font-semibold", children: "Category" }), _jsx("th", { className: "px-4 py-2 font-semibold", children: "Channel" }), _jsx("th", { className: "px-4 py-2 font-semibold", children: "Version" }), _jsx("th", { className: "px-4 py-2 font-semibold", children: "Updated" })] }) }), _jsx("tbody", { children: filtered.map((t) => (_jsxs("tr", { className: "border-t border-[var(--z-border)] hover:bg-white/[0.02]", children: [_jsxs("td", { className: "px-4 py-2", children: [_jsx(Link, { href: `/templates/${t.id}`, className: "font-semibold text-[var(--z-fg)] hover:text-[var(--z-accent)]", children: t.name }), t.description ? (_jsx("div", { className: "text-xs text-[var(--z-muted)]", children: t.description })) : null] }), _jsx("td", { className: "px-4 py-2 text-[var(--z-fg)]/80", children: t.category }), _jsx("td", { className: "px-4 py-2 text-[var(--z-fg)]/80", children: t.channel }), _jsxs("td", { className: "px-4 py-2 text-[var(--z-fg)]/80", children: ["v", t.currentVersion] }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted)]", children: relativeDate(t.updatedAt) })] }, t.id))) })] }) }))] }));
}
