import type { ReactNode } from "react";
import Link from "next/link";

export default function SandboxLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--z-bg)] text-[var(--z-fg)]">
      <div className="border-b border-[var(--z-border)] bg-[var(--z-surface-2)]">
        <div className="mx-auto max-w-5xl px-[var(--z-space-6)] py-[var(--z-space-4)] flex items-center justify-between">
          <div className="text-sm font-extrabold tracking-tight">
            <span className="text-[var(--z-accent)]">Sandbox</span>
            <span className="text-[var(--z-muted)]"> / UI</span>
          </div>
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-[var(--z-muted)] hover:text-[var(--z-fg)]"
          >
            Back to app
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-[var(--z-space-6)] py-[var(--z-space-6)]">
        {children}
      </div>
    </div>
  );
}

