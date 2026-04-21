"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function SignLinkError({ error, reset, }) {
    return (_jsxs("div", { className: "mx-auto max-w-md rounded-md border border-red-500/35 bg-red-500/10 p-6 text-sm text-red-100", children: [_jsx("h2", { className: "text-base font-semibold text-red-50", children: "Could not open this signing link" }), _jsx("p", { className: "mt-2 text-xs leading-relaxed", children: error.message || "The link may be invalid or no longer active." }), _jsx("button", { type: "button", onClick: reset, className: "mt-4 rounded-md border border-[var(--z-border)] px-3 py-1.5 text-xs text-[var(--z-fg)] hover:bg-white/[0.04]", children: "Try again" })] }));
}
