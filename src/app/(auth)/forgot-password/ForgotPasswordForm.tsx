"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { getBrowserSupabaseClient } from "@/lib/supabase.browser";

export function ForgotPasswordForm({ accent }: { accent: string }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = getBrowserSupabaseClient();
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/reset-password`
          : `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/reset-password`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo },
      );
      if (resetError) {
        setError(resetError.message || "Failed to send reset email.");
        return;
      }
      setSent(true);
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl"
          style={{ background: `${accent}22` }}
        >
          ✉️
        </div>
        <p className="text-sm font-semibold text-[var(--z-fg)]">Check your email</p>
        <p className="text-sm text-[var(--z-muted)]">
          We sent a password reset link to <strong className="text-[var(--z-fg)]">{email}</strong>.
          It may take a minute to arrive.
        </p>
        <Link
          href="/login"
          className="block text-xs text-[var(--z-muted)] underline underline-offset-2 hover:text-[var(--z-fg)] transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <label className="block text-xs text-[var(--z-muted)]">
        Email address
        <input
          className="mt-1 w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)] outline-none focus:border-[var(--z-accent)]"
          type="email"
          value={email}
          autoComplete="email"
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@example.com"
        />
      </label>
      {error && (
        <p className="text-xs text-red-400" role="alert">{error}</p>
      )}
      <button
        type="submit"
        disabled={busy || !email.trim()}
        className="block w-full rounded-[var(--z-radius-md)] px-4 py-3 text-center text-sm font-semibold text-[var(--z-bg)] outline-none transition disabled:opacity-60"
        style={{ background: accent }}
      >
        {busy ? "Sending…" : "Send reset link"}
      </button>
      <div className="text-center">
        <Link
          href="/login"
          className="text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)] transition-colors underline underline-offset-2"
        >
          Back to sign in
        </Link>
      </div>
    </form>
  );
}
