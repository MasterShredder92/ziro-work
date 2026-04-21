import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function kindIcon(kind) {
    switch (kind) {
        case "image":
            return "🖼";
        case "video":
            return "▶";
        case "audio":
            return "♪";
        case "document":
            return "📄";
        case "link":
            return "🔗";
        case "note":
        default:
            return "✎";
    }
}
export function EvidenceList({ evidence, title = "Evidence", emptyLabel = "No evidence submitted yet.", maxRows = 50, }) {
    if (evidence.length === 0) {
        return (_jsx("div", { className: "rounded-lg border border-dashed border-[var(--z-border)] p-6 text-sm text-[var(--z-muted)]", children: emptyLabel }));
    }
    const rows = evidence.slice(0, maxRows);
    return (_jsxs("section", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]", children: [_jsxs("header", { className: "border-b border-[var(--z-border)] px-4 py-3 flex items-center justify-between", children: [_jsx("h3", { className: "text-sm font-semibold text-[var(--z-fg)]", children: title }), _jsxs("span", { className: "text-xs text-[var(--z-muted)]", children: [evidence.length, " items"] })] }), _jsx("ul", { className: "divide-y divide-[var(--z-border)]", children: rows.map((e) => {
                    var _a;
                    return (_jsx("li", { className: "px-4 py-3", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "shrink-0 h-8 w-8 rounded-md border border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface-2),transparent_40%)] flex items-center justify-center text-base", children: kindIcon(e.kind) }), _jsxs("div", { className: "min-w-0 flex-1", children: [e.body ? (_jsx("p", { className: "text-sm text-[var(--z-fg)] whitespace-pre-wrap break-words", children: e.body })) : null, e.file_url ? (_jsx("a", { href: e.file_url, target: "_blank", rel: "noreferrer", className: "inline-flex items-center gap-2 text-xs text-[#00ff88] hover:underline mt-1", children: (_a = e.file_name) !== null && _a !== void 0 ? _a : e.file_url })) : null, e.teacher_feedback ? (_jsxs("div", { className: "mt-2 rounded-md border border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface-2),transparent_30%)] px-3 py-2 text-xs text-[var(--z-fg)]", children: [_jsx("span", { className: "text-[var(--z-muted)]", children: "Feedback:" }), " ", e.teacher_feedback] })) : null, _jsxs("div", { className: "mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[var(--z-muted)]", children: [_jsx("span", { children: new Date(e.created_at).toLocaleString() }), e.submitter_role ? _jsxs("span", { children: ["\u00B7 ", e.submitter_role] }) : null, typeof e.score === "number" ? (_jsxs("span", { children: ["\u00B7 score ", e.score] })) : null] })] })] }) }, e.id));
                }) })] }));
}
