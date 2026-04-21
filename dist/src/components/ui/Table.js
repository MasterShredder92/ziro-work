"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "@/components/ui/utils";
function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}
export function Table({ columns, data, renderCell, getRowKey, rowHeight = 44, height = 520, className, }) {
    const scrollRef = React.useRef(null);
    const [scrollTop, setScrollTop] = React.useState(0);
    const totalHeight = data.length * rowHeight;
    const overscan = 8;
    const startIndex = clamp(Math.floor(scrollTop / rowHeight) - overscan, 0, data.length);
    const visibleCount = Math.ceil(height / rowHeight) + overscan * 2;
    const endIndex = clamp(startIndex + visibleCount, 0, data.length);
    const offsetY = startIndex * rowHeight;
    const onScroll = React.useCallback(() => {
        const el = scrollRef.current;
        if (!el)
            return;
        setScrollTop(el.scrollTop);
    }, []);
    const visibleRows = data.slice(startIndex, endIndex);
    const gridTemplateColumns = React.useMemo(() => columns.map((c) => (c.width ? String(c.width) : "1fr")).join(" "), [columns]);
    const rootStyle = React.useMemo(() => ({ ["--z-table-cols"]: gridTemplateColumns }), [gridTemplateColumns]);
    return (_jsx("div", { className: cn("rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] overflow-hidden", className), style: rootStyle, children: _jsxs("div", { className: "grid", children: [_jsx("div", { className: "sticky top-0 z-10 bg-[var(--z-surface)] border-b border-[var(--z-border)]", children: _jsx("div", { className: "grid [grid-template-columns:var(--z-table-cols)]", children: columns.map((c) => (_jsx("div", { className: cn("px-[var(--z-space-4)] py-[var(--z-space-3)] text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]", c.align === "center" && "text-center", c.align === "right" && "text-right"), children: c.header }, c.id))) }) }), _jsx("div", { ref: scrollRef, onScroll: onScroll, className: "relative overflow-auto", style: { height }, children: _jsx("div", { className: "relative", style: { height: totalHeight }, children: _jsx("div", { className: "absolute left-0 right-0", style: { transform: `translateY(${offsetY}px)` }, children: visibleRows.map((row, i) => {
                                const rowIndex = startIndex + i;
                                const key = getRowKey ? getRowKey(row, rowIndex) : String(rowIndex);
                                return (_jsx("div", { className: cn("z-table-row-enter grid border-b border-[var(--z-border)] last:border-b-0 hover:bg-white/[0.02] [grid-template-columns:var(--z-table-cols)]"), style: {
                                        height: rowHeight,
                                        animationDelay: `${Math.min(rowIndex % 14, 13) * 28}ms`,
                                    }, children: columns.map((c) => (_jsx("div", { className: cn("px-[var(--z-space-4)] py-[var(--z-space-3)] text-sm text-[var(--z-fg)] flex items-center", c.align === "center" && "justify-center text-center", c.align === "right" && "justify-end text-right"), children: renderCell(row, c.id, rowIndex) }, c.id))) }, key));
                            }) }) }) })] }) }));
}
