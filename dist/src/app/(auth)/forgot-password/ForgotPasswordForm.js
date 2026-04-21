"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import Link from "next/link";
import { getBrowserSupabaseClient } from "@/lib/supabase.browser";
export function ForgotPasswordForm({ accent }) {
    const supabase = useMemo(() => getBrowserSupabaseClient(), []);
    const [email, setEmail] = useState("");
    const [busy, setBusy] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState(null);
    async function onSubmit(e) {
        var _a;
        e.preventDefault();
        if (busy)
            return;
        setBusy(true);
        setError(null);
        try {
            const redirectTo = typeof window !== "undefined"
                ? `${window.location.origin}/reset-password`
                : `${(_a = process.env.NEXT_PUBLIC_APP_URL) !== null && _a !== void 0 ? _a : ""}/reset-password`;
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
            if (resetError) {
                setError(resetError.message || "Failed to send reset email.");
                return;
            }
            setSent(true);
        }
        finally {
            setBusy(false);
        }
    }
    if (sent) {
        return (_jsxs("div", { className: "space-y-4 text-center", children: [_jsx("div", { className: "mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl", style: { background: `${accent}22` }, children: "\u2709\uFE0F" }), _jsx("p", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Check your email" }), _jsxs("p", { className: "text-sm text-[var(--z-muted)]", children: ["We sent a password reset link to ", _jsx("strong", { className: "text-[var(--z-fg)]", children: email }), ". It may take a minute to arrive."] }), _jsx(Link, { href: "/login", className: "block text-xs text-[var(--z-muted)] underline underline-offset-2 hover:text-[var(--z-fg)] transition-colors", children: "Back to sign in" })] }));
    }
    return (_jsxs("form", { onSubmit: onSubmit, className: "space-y-3", noValidate: true, children: [_jsxs("label", { className: "block text-xs text-[var(--z-muted)]", children: ["Email address", _jsx("input", { className: "mt-1 w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)] outline-none focus:border-[var(--z-accent)]", type: "email", value: email, autoComplete: "email", onChange: (e) => setEmail(e.target.value), required: true, placeholder: "you@example.com" })] }), error && (_jsx("p", { className: "text-xs text-red-400", role: "alert", children: error })), _jsx("button", { type: "submit", disabled: busy || !email.trim(), className: "block w-full rounded-[var(--z-radius-md)] px-4 py-3 text-center text-sm font-semibold text-[var(--z-bg)] outline-none transition disabled:opacity-60", style: { background: accent }, children: busy ? "Sending…" : "Send reset link" }), _jsx("div", { className: "text-center", children: _jsx(Link, { href: "/login", className: "text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)] transition-colors underline underline-offset-2", children: "Back to sign in" }) })] }));
}
