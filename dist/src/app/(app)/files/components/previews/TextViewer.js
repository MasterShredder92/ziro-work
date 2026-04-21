"use client";
import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from "react";
export function TextViewer({ url }) {
    const [text, setText] = useState(null);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!url)
            return;
        let cancelled = false;
        fetch(url)
            .then((r) => r.text())
            .then((t) => {
            if (!cancelled)
                setText(t);
        })
            .catch((err) => {
            if (!cancelled)
                setError(err instanceof Error ? err.message : String(err));
        });
        return () => {
            cancelled = true;
        };
    }, [url]);
    if (error) {
        return (_jsxs("div", { className: "rounded-md border border-dashed border-red-500/40 bg-red-500/5 p-3 text-sm text-red-500", children: ["Failed to load: ", error] }));
    }
    if (text === null) {
        return (_jsx("div", { className: "rounded-md border border-[var(--z-border)] p-4 text-sm text-[var(--z-muted)]", children: "Loading preview\u2026" }));
    }
    return (_jsx("pre", { className: "max-h-[70vh] overflow-auto rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-4 text-xs text-[var(--z-fg)]", children: text }));
}
