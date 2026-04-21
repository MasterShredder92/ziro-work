"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getBrowserSupabaseClient } from "@/lib/supabase.browser";
function getProjectRef() {
    var _a, _b;
    const url = (_a = process.env.NEXT_PUBLIC_SUPABASE_URL) !== null && _a !== void 0 ? _a : "";
    try {
        const host = new URL(url).hostname;
        const first = (_b = host.split(".")[0]) !== null && _b !== void 0 ? _b : "";
        return first.trim();
    }
    catch (_c) {
        return "";
    }
}
function writeCookie(name, value, maxAgeSeconds) {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}
function persistAuthCookies(params) {
    writeCookie("sb-access-token", params.accessToken, params.maxAgeSeconds);
    writeCookie("sb-refresh-token", params.refreshToken, params.maxAgeSeconds);
    const projectRef = getProjectRef();
    if (projectRef) {
        writeCookie(`sb-${projectRef}-auth-token`, params.accessToken, params.maxAgeSeconds);
        writeCookie(`sb-${projectRef}-refresh-token`, params.refreshToken, params.maxAgeSeconds);
    }
}
export function LoginForm({ accent, nextHref, }) {
    const router = useRouter();
    const supabase = useMemo(() => getBrowserSupabaseClient(), []);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    async function onSubmit(event) {
        var _a;
        event.preventDefault();
        if (busy)
            return;
        setBusy(true);
        setError(null);
        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });
            if (signInError) {
                setError(signInError.message || "Sign in failed.");
                return;
            }
            const session = data.session;
            if (!(session === null || session === void 0 ? void 0 : session.access_token) || !session.refresh_token) {
                setError("Session not available after sign in.");
                return;
            }
            const maxAgeSeconds = Math.max(60, (_a = session.expires_in) !== null && _a !== void 0 ? _a : 3600);
            persistAuthCookies({
                accessToken: session.access_token,
                refreshToken: session.refresh_token,
                maxAgeSeconds,
            });
            await supabase.auth.setSession({
                access_token: session.access_token,
                refresh_token: session.refresh_token,
            });
            await supabase.auth.getSession();
            await fetch("/api/profiles/repair", {
                method: "POST",
                credentials: "include",
            }).catch(() => null);
            router.replace(nextHref);
            router.refresh();
        }
        finally {
            setBusy(false);
        }
    }
    return (_jsxs("form", { onSubmit: onSubmit, className: "space-y-3", noValidate: true, children: [_jsxs("label", { className: "block text-xs text-[var(--z-muted)]", children: ["Email", _jsx("input", { className: "mt-1 w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)] outline-none", type: "email", value: email, autoComplete: "email", onChange: (event) => setEmail(event.target.value), required: true })] }), _jsxs("label", { className: "block text-xs text-[var(--z-muted)]", children: ["Password", _jsx("input", { className: "mt-1 w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)] outline-none", type: "password", value: password, autoComplete: "current-password", onChange: (event) => setPassword(event.target.value), required: true })] }), error ? (_jsx("p", { className: "text-xs text-red-400", role: "alert", children: error })) : null, _jsx("button", { type: "submit", className: "block w-full rounded-[var(--z-radius-md)] px-4 py-3 text-center text-sm font-semibold text-[var(--z-bg)] outline-none transition disabled:opacity-60", style: { background: accent }, disabled: busy, children: busy ? "Signing in..." : "Sign in" }), _jsx("div", { className: "text-center", children: _jsx(Link, { href: "/forgot-password", className: "text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)] transition-colors underline underline-offset-2", children: "Forgot password?" }) })] }));
}
