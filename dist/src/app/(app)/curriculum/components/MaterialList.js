import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const KIND_LABEL = {
    video: "Video",
    pdf: "PDF",
    link: "Link",
    sheet: "Sheet",
    audio: "Audio",
    note: "Note",
};
export function MaterialList({ materials, emptyMessage = "No materials attached.", }) {
    if (materials.length === 0) {
        return (_jsx("div", { className: "rounded-[var(--z-radius-md)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-4 text-center text-xs text-[var(--z-muted)]", children: emptyMessage }));
    }
    return (_jsx("ul", { className: "space-y-1.5", children: materials.map((material) => {
            var _a;
            return (_jsx("li", { className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2", children: _jsx("div", { className: "flex items-start justify-between gap-3", children: _jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: (_a = KIND_LABEL[material.kind]) !== null && _a !== void 0 ? _a : material.kind }), _jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)] truncate", children: material.url ? (_jsx("a", { href: material.url, target: "_blank", rel: "noreferrer", className: "hover:text-[var(--z-accent)]", children: material.title })) : (material.title) }), material.description ? (_jsx("div", { className: "text-xs text-[var(--z-muted)] line-clamp-2", children: material.description })) : null] }) }) }, material.id));
        }) }));
}
