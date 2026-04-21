"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { normalizeAccessTimestamp } from "@/lib/files/formatters";
function targetLabel(entry) {
    var _a, _b, _c;
    return (_c = (_b = (_a = entry.fileName) !== null && _a !== void 0 ? _a : entry.folderName) !== null && _b !== void 0 ? _b : entry.target) !== null && _c !== void 0 ? _c : "-";
}
export function AccessLogsPanel({ open, linkLabel, logs, onClose }) {
    if (!open)
        return null;
    return (_jsxs("div", { className: "absolute inset-0 z-20 flex", role: "presentation", children: [_jsx("button", { type: "button", "aria-label": "Close access logs panel", className: "flex-1 bg-black/35", onClick: onClose }), _jsx("aside", { className: "h-full w-full max-w-full animate-[slideInRight_180ms_ease-out] border-l border-[var(--z-border)] bg-[var(--z-surface)] shadow-2xl md:w-96", children: _jsxs("div", { className: "flex h-full flex-col", children: [_jsxs("div", { className: "flex items-center justify-between border-b border-[var(--z-border)] px-4 py-3", children: [_jsxs("div", { children: [_jsx("div", { className: "text-xs uppercase tracking-wider text-[var(--z-muted)]", children: "Access logs" }), _jsx("div", { className: "max-w-[220px] truncate text-sm font-semibold text-[var(--z-fg)]", children: linkLabel })] }), _jsx("button", { type: "button", className: "rounded border border-[var(--z-border)] px-2 py-1 text-xs text-[var(--z-muted)] hover:bg-white/[0.05] hover:text-[var(--z-fg)]", onClick: onClose, children: "Close" })] }), _jsxs("div", { className: "min-h-0 flex-1 overflow-y-auto p-4", children: [logs.length === 0 ? (_jsx("div", { className: "rounded border border-dashed border-[var(--z-border)] px-3 py-6 text-center text-xs text-[var(--z-muted)]", children: "No access logs yet" })) : null, _jsx("ul", { className: "space-y-2", children: logs.map((entry, idx) => {
                                        var _a, _b;
                                        const normalized = normalizeAccessTimestamp(entry);
                                        return (_jsxs("li", { className: "rounded border border-[var(--z-border)] bg-white/[0.02] p-2 text-xs", children: [_jsx("div", { className: "text-[var(--z-fg)]", title: normalized.iso || undefined, children: normalized.relative }), _jsxs("div", { className: "mt-1 text-[10px] text-[var(--z-muted)]", children: ["IP: ", entry.ip || "-"] }), _jsxs("div", { className: "text-[10px] text-[var(--z-muted)]", children: ["User Agent: ", entry.userAgent || "-"] }), _jsxs("div", { className: "text-[10px] text-[var(--z-muted)]", children: ["File/Folder: ", targetLabel(entry)] })] }, `${(_b = (_a = entry.timestamp) !== null && _a !== void 0 ? _a : entry.at) !== null && _b !== void 0 ? _b : "log"}-${idx}`));
                                    }) })] })] }) })] }));
}
