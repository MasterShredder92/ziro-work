"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
const ROW_PX = 56;
const OVERSCAN = 6;
function formatBytes(n) {
    if (!n)
        return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let idx = 0;
    let v = n;
    while (v >= 1024 && idx < units.length - 1) {
        v /= 1024;
        idx += 1;
    }
    return `${v.toFixed(v >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
}
function formatDate(iso) {
    try {
        return new Date(iso).toLocaleDateString();
    }
    catch (_a) {
        return iso.slice(0, 10);
    }
}
export function VirtualizedFileRows({ files }) {
    const outerRef = useRef(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [viewH, setViewH] = useState(480);
    const onScroll = useCallback(() => {
        const el = outerRef.current;
        if (!el)
            return;
        setScrollTop(el.scrollTop);
    }, []);
    const totalH = files.length * ROW_PX;
    const { start, end } = useMemo(() => {
        const startIdx = Math.max(0, Math.floor(scrollTop / ROW_PX) - OVERSCAN);
        const visible = Math.ceil(viewH / ROW_PX) + OVERSCAN * 2;
        const endIdx = Math.min(files.length, startIdx + visible);
        return { start: startIdx, end: endIdx };
    }, [files.length, scrollTop, viewH]);
    const slice = useMemo(() => files.slice(start, end), [files, start, end]);
    return (_jsx("div", { ref: (el) => {
            outerRef.current = el;
            if (el && el.clientHeight !== viewH)
                setViewH(el.clientHeight || 480);
        }, className: "max-h-[min(70vh,560px)] overflow-auto", onScroll: onScroll, children: _jsx("div", { style: { height: totalH, position: "relative" }, children: _jsx("div", { className: "absolute left-0 right-0 divide-y divide-[var(--z-border)]", style: { transform: `translateY(${start * ROW_PX}px)` }, children: slice.map((f) => {
                    var _a;
                    return (_jsxs("div", { style: { height: ROW_PX }, className: "grid grid-cols-[minmax(0,2fr)_1fr_80px_100px_80px_100px] items-center gap-2 px-4 text-sm hover:bg-white/[0.02]", children: [_jsxs("div", { className: "min-w-0", children: [_jsx(Link, { href: `/files/${f.id}`, className: "block truncate font-medium text-[var(--z-fg)] hover:text-[var(--z-accent)]", children: f.name }), f.description ? (_jsx("div", { className: "truncate text-xs text-[var(--z-muted)]", children: f.description })) : null] }), _jsx("div", { className: "truncate text-xs text-[var(--z-muted)]", children: f.mimeType || "—" }), _jsx("div", { className: "text-xs text-[var(--z-muted)]", children: formatBytes(f.size) }), _jsx("div", { children: _jsx("span", { className: "inline-flex items-center rounded-full border border-[var(--z-border)] px-2 py-0.5 text-xs text-[var(--z-muted)]", children: f.visibility }) }), _jsx("div", { className: "text-xs text-[var(--z-muted)]", children: (_a = f.signatureStatus) !== null && _a !== void 0 ? _a : "—" }), _jsx("div", { className: "text-xs text-[var(--z-muted)]", children: formatDate(f.updatedAt) })] }, f.id));
                }) }) }) }));
}
