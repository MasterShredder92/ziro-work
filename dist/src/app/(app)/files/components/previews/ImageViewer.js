"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
export function ImageViewer({ url, name }) {
    const [broken, setBroken] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [rotate, setRotate] = useState(0);
    if (!url)
        return null;
    if (broken) {
        return (_jsxs("div", { className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-8 text-center text-sm text-[var(--z-muted)]", children: ["Could not display this image.", _jsx("div", { className: "mt-2", children: _jsx("a", { href: url, target: "_blank", rel: "noreferrer", className: "text-[var(--z-accent)] underline", children: "Open in new tab" }) })] }));
    }
    return (_jsxs("div", { className: "space-y-2 rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2 text-xs text-[var(--z-fg)]", children: [_jsx("span", { className: "text-[var(--z-muted)]", children: "Zoom" }), _jsx("button", { type: "button", className: "rounded border border-[var(--z-border)] px-2 py-0.5 hover:bg-white/[0.05]", onClick: () => setZoom((z) => Math.max(0.25, z - 0.25)), children: "\u2212" }), _jsxs("span", { className: "tabular-nums", children: [Math.round(zoom * 100), "%"] }), _jsx("button", { type: "button", className: "rounded border border-[var(--z-border)] px-2 py-0.5 hover:bg-white/[0.05]", onClick: () => setZoom((z) => Math.min(4, z + 0.25)), children: "+" }), _jsx("span", { className: "ml-2 text-[var(--z-muted)]", children: "Rotate" }), _jsx("button", { type: "button", className: "rounded border border-[var(--z-border)] px-2 py-0.5 hover:bg-white/[0.05]", onClick: () => setRotate((r) => r - 90), children: "\u27F2" }), _jsx("button", { type: "button", className: "rounded border border-[var(--z-border)] px-2 py-0.5 hover:bg-white/[0.05]", onClick: () => setRotate((r) => r + 90), children: "\u27F3" }), _jsx("a", { href: url, target: "_blank", rel: "noreferrer", className: "ml-auto text-[var(--z-accent)] underline", children: "Open in new tab" })] }), _jsx("div", { className: "flex max-h-[75vh] items-center justify-center overflow-auto", children: _jsx("img", { src: url, alt: name !== null && name !== void 0 ? name : "Image preview", className: "max-w-full rounded shadow-sm transition-transform duration-150", style: {
                        transform: `rotate(${rotate}deg) scale(${zoom})`,
                        transformOrigin: "center center",
                    }, onError: () => setBroken(true) }) })] }));
}
