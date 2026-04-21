"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getBrowserSupabaseClient } from "@/lib/supabase.browser";
export function ResetPasswordForm({ accent }) {
    const supabase = useMemo(() => getBrowserSupabaseClient(), []);
    const router = useRouter();
    const [phase, setPhase] = useState("loading");
    const [initError, setInitError] = useState(null);
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [busy, setBusy] = useState(false);
    const [formError, setFormError] = useState(null);
    // Supabase puts the recovery token in the URL hash as #access_token=...&type=recovery
    // We need to exchange it for a session before we can call updateUser.
    useEffect(() => {
        async function init() {
            try {
                // getSession will pick up the token from the URL hash automatically
                // because detectSessionInUrl: true is set in the browser client.
                const { data, error } = await supabase.auth.getSession();
                if (error) {
                    setInitError(error.message);
                    setPhase("error");
                    return;
                }
                if (data.session) {
                    setPhase("form");
                    return;
                }
                // If no session yet, listen for the PASSWORD_RECOVERY event
                const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
                    if (event === "PASSWORD_RECOVERY") {
                        setPhase("form");
                        subscription.unsubscribe();
                    }
                });
                // Give it 5 seconds then show error
                setTimeout(() => {
                    setInitError("Reset link expired or invalid. Please request a new one.");
                    setPhase("error");
                    subscription.unsubscribe();
                }, 5000);
            }
            catch (err) {
                setInitError(err instanceof Error ? err.message : "Unexpected error");
                setPhase("error");
            }
        }
        void init();
    }, [supabase]);
    async function onSubmit(e) {
        e.preventDefault();
        if (busy)
            return;
        setFormError(null);
        if (password.length < 8) {
            setFormError("Password must be at least 8 characters.");
            return;
        }
        if (password !== confirm) {
            setFormError("Passwords do not match.");
            return;
        }
        setBusy(true);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) {
                setFormError(error.message || "Failed to update password.");
                return;
            }
            setPhase("success");
            setTimeout(() => router.replace("/dashboard"), 2500);
        }
        finally {
            setBusy(false);
        }
    }
    if (phase === "loading") {
        return (_jsxs("div", { className: "flex flex-col items-center gap-3 py-6", children: [_jsx("div", { className: "h-8 w-8 animate-spin rounded-full border-2 border-[var(--z-border)] border-t-[var(--z-accent)]" }), _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "Verifying reset link\u2026" })] }));
    }
    if (phase === "error") {
        return (_jsxs("div", { className: "space-y-4 text-center", children: [_jsx("p", { className: "text-sm text-red-400", children: initError !== null && initError !== void 0 ? initError : "Invalid or expired reset link." }), _jsx(Link, { href: "/forgot-password", className: "block text-sm font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity", style: { color: accent }, children: "Request a new reset link" })] }));
    }
    if (phase === "success") {
        return (_jsxs("div", { className: "space-y-4 text-center", children: [_jsx("div", { className: "mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl", style: { background: `${accent}22` }, children: "\u2713" }), _jsx("p", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Password updated!" }), _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "Redirecting you to the dashboard\u2026" })] }));
    }
    return (_jsxs("form", { onSubmit: onSubmit, className: "space-y-3", noValidate: true, children: [_jsxs("label", { className: "block text-xs text-[var(--z-muted)]", children: ["New password", _jsx("input", { className: "mt-1 w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)] outline-none focus:border-[var(--z-accent)]", type: "password", value: password, autoComplete: "new-password", onChange: (e) => setPassword(e.target.value), required: true, minLength: 8, placeholder: "At least 8 characters" })] }), _jsxs("label", { className: "block text-xs text-[var(--z-muted)]", children: ["Confirm new password", _jsx("input", { className: "mt-1 w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)] outline-none focus:border-[var(--z-accent)]", type: "password", value: confirm, autoComplete: "new-password", onChange: (e) => setConfirm(e.target.value), required: true, placeholder: "Re-enter password" })] }), formError && (_jsx("p", { className: "text-xs text-red-400", role: "alert", children: formError })), _jsx("button", { type: "submit", disabled: busy || !password || !confirm, className: "block w-full rounded-[var(--z-radius-md)] px-4 py-3 text-center text-sm font-semibold text-[var(--z-bg)] outline-none transition disabled:opacity-60", style: { background: accent }, children: busy ? "Saving…" : "Set new password" }), _jsx("div", { className: "text-center", children: _jsx(Link, { href: "/login", className: "text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)] transition-colors underline underline-offset-2", children: "Back to sign in" }) })] }));
}
