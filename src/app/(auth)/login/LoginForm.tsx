"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getBrowserSupabaseClient } from "@/lib/supabase.browser";

function getProjectRef(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  try {
    const host = new URL(url).hostname;
    const first = host.split(".")[0] ?? "";
    return first.trim();
  } catch {
    return "";
  }
}

function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

function persistAuthCookies(params: {
  accessToken: string;
  refreshToken: string;
  maxAgeSeconds: number;
}) {
  writeCookie("sb-access-token", params.accessToken, params.maxAgeSeconds);
  writeCookie("sb-refresh-token", params.refreshToken, params.maxAgeSeconds);
  const projectRef = getProjectRef();
  if (projectRef) {
    writeCookie(
      `sb-${projectRef}-auth-token`,
      params.accessToken,
      params.maxAgeSeconds,
    );
    writeCookie(
      `sb-${projectRef}-refresh-token`,
      params.refreshToken,
      params.maxAgeSeconds,
    );
  }
}

export function LoginForm({
  accent,
  nextHref,
}: {
  accent: string;
  nextHref: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = getBrowserSupabaseClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError(signInError.message || "Sign in failed.");
        return;
      }
      const session = data.session;
      if (!session?.access_token || !session.refresh_token) {
        setError("Session not available after sign in.");
        return;
      }
      const maxAgeSeconds = Math.max(60, session.expires_in ?? 3600);
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
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <label className="block text-xs text-[var(--z-muted)]">
        Email
        <input
          className="mt-1 w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)] outline-none"
          type="email"
          value={email}
          autoComplete="email"
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>
      <label className="block text-xs text-[var(--z-muted)]">
        Password
        <input
          className="mt-1 w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)] outline-none"
          type="password"
          value={password}
          autoComplete="current-password"
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      {error ? (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        className="block w-full rounded-[var(--z-radius-md)] px-4 py-3 text-center text-sm font-semibold text-[var(--z-bg)] outline-none transition disabled:opacity-60"
        style={{ background: accent }}
        disabled={busy}
      >
        {busy ? "Signing in..." : "Sign in"}
      </button>
      <div className="text-center">
        <Link
          href="/forgot-password"
          className="text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)] transition-colors underline underline-offset-2"
        >
          Forgot password?
        </Link>
      </div>
    </form>
  );
}
