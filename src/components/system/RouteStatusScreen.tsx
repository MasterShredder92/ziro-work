"use client";

import Link from "next/link";

type Action = {
  href: string;
  label: string;
  kind?: "primary" | "secondary";
};

type RouteStatusScreenProps = {
  code: string;
  title: string;
  message: string;
  actions?: Action[];
};

export function RouteStatusScreen({ code, title, message, actions = [] }: RouteStatusScreenProps) {
  return (
    <section
      className="mx-auto flex min-h-[60vh] w-full max-w-xl items-center justify-center px-4 py-10 sm:px-6"
      aria-labelledby="route-status-title"
      aria-live="polite"
    >
      <div className="w-full rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--z-muted)]">{code}</p>
        <h1 id="route-status-title" className="mt-2 text-2xl font-extrabold text-[var(--z-fg)]">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--z-muted)]">{message}</p>
        {actions.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-3">
            {actions.map((action) => {
              const primary = action.kind !== "secondary";
              return (
                <Link
                  key={`${action.href}:${action.label}`}
                  href={action.href}
                  className={
                    primary
                      ? "inline-flex items-center rounded-[var(--z-radius-md)] bg-[var(--z-accent)] px-4 py-2 text-sm font-semibold text-[var(--z-on-accent,white)] transition hover:opacity-90"
                      : "inline-flex items-center rounded-[var(--z-radius-md)] border border-[var(--z-border)] px-4 py-2 text-sm font-semibold text-[var(--z-fg)] transition hover:bg-white/5"
                  }
                >
                  {action.label}
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
