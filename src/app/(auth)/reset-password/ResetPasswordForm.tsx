"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getBrowserSupabaseClient } from "@/lib/supabase.browser";

type Phase = "loading" | "form" | "success" | "error";

export function ResetPasswordForm({ accent }: { accent: string }) {
  const supabase = useMemo(() => getBrowserSupabaseClient(), []);
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("loading");
  const [initError, setInitError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string) => {
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
      } catch (err) {
        setInitError(err instanceof Error ? err.message : "Unexpected error");
        setPhase("error");
      }
    }
    void init();
  }, [supabase]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
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
    } finally {
      setBusy(false);
    }
  }

  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--z-border)] border-t-[var(--z-accent)]" />
        <p className="text-sm text-[var(--z-muted)]">Verifying reset link…</p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-red-400">{initError ?? "Invalid or expired reset link."}</p>
        <Link
          href="/forgot-password"
          className="block text-sm font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
          style={{ color: accent }}
        >
          Request a new reset link
        </Link>
      </div>
    );
  }

  if (phase === "success") {
    return (
      <div className="space-y-4 text-center">
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl"
          style={{ background: `${accent}22` }}
        >
          ✓
        </div>
        <p className="text-sm font-semibold text-[var(--z-fg)]">Password updated!</p>
        <p className="text-sm text-[var(--z-muted)]">Redirecting you to the dashboard…</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <label className="block text-xs text-[var(--z-muted)]">
        New password
        <input
          className="mt-1 w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)] outline-none focus:border-[var(--z-accent)]"
          type="password"
          value={password}
          autoComplete="new-password"
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          placeholder="At least 8 characters"
        />
      </label>
      <label className="block text-xs text-[var(--z-muted)]">
        Confirm new password
        <input
          className="mt-1 w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)] outline-none focus:border-[var(--z-accent)]"
          type="password"
          value={confirm}
          autoComplete="new-password"
          onChange={(e) => setConfirm(e.target.value)}
          required
          placeholder="Re-enter password"
        />
      </label>
      {formError && (
        <p className="text-xs text-red-400" role="alert">{formError}</p>
      )}
      <button
        type="submit"
        disabled={busy || !password || !confirm}
        className="block w-full rounded-[var(--z-radius-md)] px-4 py-3 text-center text-sm font-semibold text-[var(--z-bg)] outline-none transition disabled:opacity-60"
        style={{ background: accent }}
      >
        {busy ? "Saving…" : "Set new password"}
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
