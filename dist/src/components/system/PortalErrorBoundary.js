"use client";
import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
const PORTAL_COPY = {
    admin: { headline: "Something broke in the admin console", home: "/admin" },
    director: { headline: "Something broke in the director portal", home: "/director" },
    teacher: { headline: "Something broke in the teacher portal", home: "/teacher" },
    family: { headline: "Something broke in the family portal", home: "/family" },
    student: { headline: "Something broke in the student portal", home: "/student" },
};
export function PortalErrorBoundary({ portal, error, reset }) {
    useEffect(() => {
        console.error(`[${portal}.error_boundary]`, {
            name: error.name,
            message: error.message,
            digest: error.digest,
            stack: error.stack,
        });
    }, [portal, error]);
    const copy = PORTAL_COPY[portal];
    return (_jsx("div", { className: "min-h-[60vh] flex items-center justify-center px-6 py-16", children: _jsxs(Card, { className: "max-w-md w-full", padding: "lg", children: [_jsxs("div", { className: "text-xs uppercase tracking-wider text-[var(--z-muted)] mb-2", children: ["Error \u00B7 ", portal, " portal"] }), _jsx("h1", { className: "text-2xl font-extrabold text-[var(--z-fg)] mb-3", children: copy.headline }), _jsx("p", { className: "text-sm text-[var(--z-muted)] mb-6", children: "We logged the error. You can retry or return to the portal home." }), error.digest ? (_jsxs("div", { className: "text-[11px] text-[var(--z-muted)] mb-6 font-mono", children: ["ref: ", error.digest] })) : null, _jsxs("div", { className: "flex gap-3", children: [_jsx(Button, { type: "button", onClick: () => reset(), children: "Try again" }), _jsx(Link, { href: copy.home, className: "inline-flex items-center px-4 py-2 rounded-lg border border-[var(--z-border)] text-sm text-[var(--z-fg)] hover:bg-white/[0.04]", children: "Portal home" })] })] }) }));
}
