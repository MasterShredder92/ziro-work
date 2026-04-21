"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
export default function AppErrorBoundary({ error, unstable_retry, reset, }) {
    useEffect(() => {
        console.error("[app.error_boundary]", {
            name: error.name,
            message: error.message,
            digest: error.digest,
            stack: error.stack,
        });
    }, [error]);
    return (_jsx("div", { className: "flex min-h-[60vh] items-center justify-center px-6 py-16", children: _jsxs(Card, { className: "max-w-md w-full", padding: "lg", children: [_jsx("div", { className: "mb-2 text-xs uppercase tracking-wider text-[var(--z-muted)]", children: "Something went wrong" }), _jsx("h1", { className: "mb-3 text-2xl font-extrabold text-[var(--z-fg)]", children: "We hit an unexpected error" }), _jsx("p", { className: "mb-6 text-sm text-[var(--z-muted)]", children: "The team has been notified. You can retry the action or head back to your dashboard." }), error.digest ? (_jsxs("div", { className: "mb-6 text-[11px] font-mono text-[var(--z-muted)]", children: ["ref: ", error.digest] })) : null, _jsxs("div", { className: "flex gap-3", role: "alert", "aria-live": "polite", children: [_jsx(Button, { type: "button", onClick: () => (unstable_retry ? unstable_retry() : reset()), children: "Try again" }), _jsx(Link, { href: "/dashboard", className: "inline-flex items-center rounded-lg border border-[var(--z-border)] px-4 py-2 text-sm text-[var(--z-fg)] outline-none transition hover:bg-white/[0.04]", children: "Go to Dashboard" })] })] }) }));
}
