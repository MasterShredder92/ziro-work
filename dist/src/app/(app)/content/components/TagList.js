import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function TagList({ tags, usageBySlug, emptyMessage = "No tags yet.", }) {
    if (tags.length === 0) {
        return (_jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-6 text-center text-xs text-[var(--z-muted)]", children: emptyMessage }));
    }
    return (_jsx("div", { className: "flex flex-wrap gap-2", children: tags.map((t) => {
            var _a, _b;
            const count = (_a = usageBySlug === null || usageBySlug === void 0 ? void 0 : usageBySlug.get(t.slug)) !== null && _a !== void 0 ? _a : 0;
            return (_jsxs("span", { className: "inline-flex items-center gap-1.5 rounded-full border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-0.5 text-xs text-[var(--z-fg)]", children: [_jsx("span", { className: "inline-block h-2 w-2 rounded-full", style: {
                            background: (_b = t.color) !== null && _b !== void 0 ? _b : "color-mix(in oklab, var(--z-accent), transparent 50%)",
                        } }), _jsx("span", { children: t.label }), _jsx("span", { className: "text-[10px] text-[var(--z-muted)]", children: count })] }, t.id));
        }) }));
}
