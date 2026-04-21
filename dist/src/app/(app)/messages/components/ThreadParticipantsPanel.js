"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ChevronDown, Mail, MessageSquare, Smartphone } from "lucide-react";
import { useMemo, useState } from "react";
import { collapsedNamePreview, deriveThreadParticipants, } from "./deriveThreadParticipants";
function ChannelGlyph({ channel }) {
    const cls = "size-3.5 shrink-0 text-[var(--z-muted)]";
    if (channel === "email")
        return _jsx(Mail, { className: cls, "aria-hidden": true });
    if (channel === "sms")
        return _jsx(Smartphone, { className: cls, "aria-hidden": true });
    return _jsx(MessageSquare, { className: cls, "aria-hidden": true });
}
function RoleBadge({ role }) {
    const tone = role === "Owner"
        ? "bg-amber-500/15 text-amber-200"
        : role === "Admin"
            ? "bg-blue-500/15 text-blue-200"
            : "bg-[color-mix(in_oklab,var(--z-surface),white_8%)] text-[var(--z-muted)]";
    return (_jsx("span", { className: `rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tone}`, children: role }));
}
export function ThreadParticipantsPanel({ participants, threadChannelType, contextType, threadSubject, }) {
    const [open, setOpen] = useState(false);
    const rows = useMemo(() => deriveThreadParticipants(participants, threadChannelType, contextType, threadSubject), [participants, threadChannelType, contextType, threadSubject]);
    const preview = useMemo(() => collapsedNamePreview(rows), [rows]);
    const n = rows.length;
    if (n === 0)
        return null;
    const stack = rows.slice(0, 4);
    return (_jsxs("section", { className: "shrink-0 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]", children: [_jsxs("button", { type: "button", onClick: () => setOpen((v) => !v), className: "flex w-full items-center gap-3 rounded-t-lg px-3 py-2.5 text-left transition hover:bg-[var(--z-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent)]", "aria-expanded": open, children: [_jsxs("div", { className: "flex min-w-0 flex-1 flex-col gap-1", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--z-fg)]", children: [_jsx("span", { children: "Participants" }), _jsx("span", { className: "text-[var(--z-muted)]", children: "\u00B7" }), _jsx("span", { className: "tabular-nums text-[var(--z-muted)]", children: n })] }), _jsxs("div", { className: "flex min-w-0 items-center gap-2", children: [_jsx("div", { className: "flex shrink-0 -space-x-2", children: stack.map((r) => (_jsxs("span", { className: "relative inline-flex size-7 items-center justify-center rounded-full border border-[var(--z-border)] bg-[var(--z-surface-2)] text-[10px] font-bold text-[var(--z-fg)] first:ml-0", title: r.name, children: [r.initials, _jsx("span", { className: `absolute -bottom-0.5 -right-0.5 size-2 rounded-full ring-2 ring-[var(--z-surface)] ${r.activeNow ? "bg-emerald-400" : "bg-zinc-500"}`, title: r.presenceTooltip, "aria-label": r.presenceTooltip })] }, r.id))) }), _jsxs("p", { className: "min-w-0 truncate text-[11px] text-[var(--z-muted)]", children: [preview, n > 6 ? "…" : ""] })] })] }), _jsx(ChevronDown, { className: `size-4 shrink-0 text-[var(--z-muted)] transition-transform ${open ? "rotate-180" : ""}`, "aria-hidden": true })] }), _jsx("div", { className: `grid overflow-hidden transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`, children: _jsx("div", { className: "min-h-0", children: _jsx("div", { className: "space-y-3 border-t border-[var(--z-border)] px-3 pb-3 pt-2", children: rows.map((r) => (_jsxs("article", { className: "flex gap-3 rounded-md border border-transparent px-1 py-1", children: [_jsx("div", { className: "flex size-9 shrink-0 items-center justify-center rounded-full border border-[var(--z-border)] bg-[var(--z-surface-2)] text-[11px] font-bold text-[var(--z-fg)]", children: r.initials }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx(ChannelGlyph, { channel: r.channel }), _jsx("span", { className: `inline-flex size-2 rounded-full ${r.activeNow ? "bg-emerald-400" : "bg-zinc-500"}`, title: r.presenceTooltip, "aria-label": r.presenceTooltip }), _jsx("span", { className: "truncate text-sm font-medium text-[var(--z-fg)]", children: r.name }), _jsx(RoleBadge, { role: r.memberRoleBadge })] }), _jsxs("p", { className: "mt-0.5 text-[11px] text-[var(--z-muted)]", children: [r.profileRole ? `${r.profileRole} · ` : "", r.threadRoleLabel] }), r.email || r.phone ? (_jsx("p", { className: "mt-0.5 text-[11px] text-[var(--z-fg)]", children: [r.email, r.phone].filter(Boolean).join(" · ") })) : null, r.relationships.length > 0 ? (_jsx("ul", { className: "mt-1 space-y-0.5 text-[10px] text-[var(--z-muted)]", children: r.relationships.map((line, i) => (_jsx("li", { children: line }, i))) })) : null] })] }, r.id))) }) }) })] }));
}
