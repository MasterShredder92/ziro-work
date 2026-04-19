"use client";

import type { ReactNode } from "react";
import Link from "next/link";

export function FilesPublicChrome({
  children,
  variant,
}: {
  children: ReactNode;
  variant: "share" | "sign";
}) {
  const label = variant === "share" ? "Shared file" : "E‑signature";
  return (
    <div
      className="flex min-h-[100dvh] flex-col bg-[color-mix(in_oklab,var(--z-bg),black_6%)] text-[var(--z-fg)] [@media(prefers-color-scheme:light)]:bg-zinc-100 [@media(prefers-color-scheme:light)]:text-zinc-900"
    >
      <header className="border-b border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-4 md:px-8 [@media(prefers-color-scheme:light)]:border-zinc-200 [@media(prefers-color-scheme:light)]:bg-white">
        <div className="mx-auto flex max-w-3xl flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--z-muted)] [@media(prefers-color-scheme:light)]:text-zinc-500">
              Secure link
            </div>
            <div className="text-sm font-semibold text-[var(--z-fg)] [@media(prefers-color-scheme:light)]:text-zinc-900">
              {label}
            </div>
          </div>
          <Link
            href="/"
            className="text-xs text-[var(--z-accent)] hover:underline [@media(prefers-color-scheme:light)]:text-emerald-700"
          >
            Organization home
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 md:px-8 md:py-10">{children}</main>
      <footer className="border-t border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-6 text-center text-[11px] text-[var(--z-muted)] md:px-8 [@media(prefers-color-scheme:light)]:border-zinc-200 [@media(prefers-color-scheme:light)]:bg-white [@media(prefers-color-scheme:light)]:text-zinc-600">
        <p>
          If this link looks suspicious, close this page and contact the sender through a trusted
          channel.
        </p>
        <p className="mt-2">
          <Link
            href="/login"
            className="text-[var(--z-accent)] hover:underline [@media(prefers-color-scheme:light)]:text-emerald-700"
          >
            Staff sign in
          </Link>
        </p>
      </footer>
    </div>
  );
}
