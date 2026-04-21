import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
function kindIcon(kind) {
    switch (kind) {
        case "video":
            return "▶";
        case "audio":
            return "♫";
        case "image":
            return "▦";
        case "document":
            return "◫";
        case "link":
            return "↗";
        case "note":
            return "✎";
        default:
            return "⬚";
    }
}
function formatBytes(bytes) {
    if (!bytes || bytes <= 0)
        return null;
    const kb = bytes / 1024;
    if (kb < 1024)
        return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    if (mb < 1024)
        return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(1)} GB`;
}
export function ContentList({ items, emptyMessage = "No content items yet.", }) {
    if (items.length === 0) {
        return (_jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-8 text-center text-sm text-[var(--z-muted)]", children: emptyMessage }));
    }
    return (_jsx("ul", { className: "grid gap-2", children: items.map((item) => {
            const size = formatBytes(item.file_size_bytes);
            return (_jsx("li", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] transition-colors hover:border-[color-mix(in_oklab,var(--z-accent),transparent_55%)]", children: _jsxs(Link, { href: `/content/${item.id}`, className: "flex items-start gap-3 px-4 py-3", children: [_jsx("div", { className: "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] text-base text-[var(--z-muted)]", children: kindIcon(item.kind) }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)] truncate", children: item.title }), _jsx("span", { className: "rounded-full border border-[var(--z-border)] bg-[var(--z-surface-2)] px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[var(--z-muted)]", children: item.kind }), item.visibility !== "tenant" ? (_jsx("span", { className: "rounded-full border border-[var(--z-border)] bg-[var(--z-surface-2)] px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[var(--z-muted)]", children: item.visibility })) : null] }), item.description ? (_jsx("div", { className: "mt-0.5 line-clamp-2 text-xs text-[var(--z-muted)]", children: item.description })) : null, _jsxs("div", { className: "mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-[var(--z-muted)]", children: [item.file_name ? _jsx("span", { children: item.file_name }) : null, size ? _jsxs("span", { children: ["\u00B7 ", size] }) : null, item.tags.length > 0 ? (_jsxs("span", { children: ["\u00B7 ", item.tags.slice(0, 4).join(", ")] })) : null, _jsxs("span", { children: ["\u00B7 Viewed ", item.access_count] })] })] })] }) }, item.id));
        }) }));
}
