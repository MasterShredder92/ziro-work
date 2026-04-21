"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
const CHECK_MS = 1500;
function statusLabel(s) {
    switch (s) {
        case "checking":
            return "Checking…";
        case "ok":
            return "Looks good";
        case "pending":
            return "Pending propagation";
        default:
            return "Not checked";
    }
}
function statusClass(s) {
    switch (s) {
        case "ok":
            return "text-green-500";
        case "pending":
            return "text-amber-500";
        case "checking":
            return "text-[var(--z-muted)]";
        default:
            return "text-gray-400";
    }
}
export function DNSStatusPanel({ domain }) {
    const [status, setStatus] = useState("idle");
    const timerRef = useRef(null);
    useEffect(() => {
        return () => {
            if (timerRef.current)
                clearTimeout(timerRef.current);
        };
    }, []);
    const displayDomain = domain && domain.trim() ? domain.trim() : "No domain configured";
    function runCheck() {
        var _a;
        const host = (_a = domain === null || domain === void 0 ? void 0 : domain.trim()) !== null && _a !== void 0 ? _a : "";
        if (!host || status === "checking")
            return;
        if (timerRef.current)
            clearTimeout(timerRef.current);
        setStatus("checking");
        timerRef.current = setTimeout(() => {
            timerRef.current = null;
            const lower = host.toLowerCase();
            if (lower.endsWith(".test"))
                setStatus("ok");
            else
                setStatus("pending");
        }, CHECK_MS);
    }
    return (_jsxs("section", { className: "rounded-[var(--brand-card-radius,1rem)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-3", "aria-labelledby": "dns-status-heading", children: [_jsx("h2", { id: "dns-status-heading", className: "text-sm font-semibold text-[var(--z-fg)]", children: "DNS Status" }), _jsx("p", { className: "font-mono text-xs text-[var(--z-muted)] break-all", children: displayDomain }), _jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx("button", { type: "button", disabled: status === "checking" || !(domain === null || domain === void 0 ? void 0 : domain.trim()), onClick: runCheck, className: "h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 text-xs font-semibold text-[var(--z-fg)] hover:bg-white/5 disabled:opacity-50", children: "Check DNS" }), _jsxs("span", { className: `text-xs font-medium ${statusClass(status)}`, children: ["Status: ", statusLabel(status)] })] }), _jsx("p", { className: "text-[10px] leading-snug text-[var(--z-muted)]", children: "Stub preview only \u2014 no DNS lookups are performed." })] }));
}
