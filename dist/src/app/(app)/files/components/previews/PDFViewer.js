"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useMemo, useState } from "react";
export function PDFViewer({ url, name }) {
    const [zoom, setZoom] = useState(100);
    const [page, setPage] = useState(1);
    const objectUrl = useMemo(() => {
        if (!url)
            return "";
        try {
            const u = new URL(url);
            u.hash = `page=${Math.max(1, page)}`;
            return u.toString();
        }
        catch (_a) {
            return `${url}#page=${Math.max(1, page)}`;
        }
    }, [url, page]);
    const nudgeZoom = useCallback((delta) => {
        setZoom((z) => Math.min(200, Math.max(50, Math.round(z + delta))));
    }, []);
    if (!url) {
        return (_jsx("div", { className: "rounded-md border border-dashed border-[var(--z-border)] p-6 text-center text-sm text-[var(--z-muted)]", children: "No PDF available." }));
    }
    return (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2 rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1.5 text-xs text-[var(--z-fg)]", children: [_jsx("span", { className: "text-[var(--z-muted)]", children: "Zoom" }), _jsx("button", { type: "button", className: "rounded border border-[var(--z-border)] px-2 py-0.5 hover:bg-white/[0.04]", onClick: () => nudgeZoom(-10), children: "\u2212" }), _jsxs("span", { className: "min-w-[3rem] text-center", children: [zoom, "%"] }), _jsx("button", { type: "button", className: "rounded border border-[var(--z-border)] px-2 py-0.5 hover:bg-white/[0.04]", onClick: () => nudgeZoom(10), children: "+" }), _jsx("span", { className: "mx-1 text-[var(--z-border)]", children: "|" }), _jsxs("label", { className: "flex items-center gap-1 text-[var(--z-muted)]", children: ["Page", _jsx("input", { type: "number", min: 1, value: page, onChange: (e) => setPage(Math.max(1, Number(e.target.value) || 1)), className: "w-14 rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-1 py-0.5 text-[var(--z-fg)]" })] }), _jsx("a", { className: "ml-auto text-[var(--z-accent)] underline", href: url, target: "_blank", rel: "noreferrer", children: "Open in new tab" })] }), _jsx("div", { className: "overflow-auto rounded-md border border-[var(--z-border)] bg-[var(--z-surface)]", style: { maxHeight: "70vh" }, children: _jsx("div", { style: {
                        width: `${zoom}%`,
                        minHeight: "60vh",
                        margin: "0 auto",
                        transition: "width 120ms ease-out",
                    }, children: _jsx("object", { data: objectUrl, type: "application/pdf", className: "h-[65vh] w-full bg-white", "aria-label": name !== null && name !== void 0 ? name : "PDF preview", children: _jsxs("p", { className: "p-4 text-sm text-[var(--z-muted)]", children: ["PDF preview not supported in this browser.", " ", _jsx("a", { className: "text-[var(--z-accent)] underline", href: url, target: "_blank", rel: "noreferrer", children: "Open PDF" })] }) }) }) })] }));
}
