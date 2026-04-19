"use client";

import Link from "next/link";

export type PortalQuickAction = {
  /** Must match sidebar nav `id` when filtering by `allowedNavIds` */
  id: string;
  href: string;
  label: string;
  icon: string;
};

const SCROLLER =
  "flex gap-2 overflow-x-auto overscroll-x-contain py-2 px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

const ACTION_CLASS =
  "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-md bg-[var(--z-surface-2)] px-3 py-1.5 text-sm font-medium text-[var(--z-fg)] transition-colors hover:bg-[color-mix(in_oklab,var(--z-surface-2),white_8%)] active:bg-[color-mix(in_oklab,var(--z-surface-2),white_12%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent)] sm:min-h-0";

export function PortalQuickActionStrip({
  actions,
  allowedNavIds,
  ariaLabel,
}: {
  actions: readonly PortalQuickAction[];
  allowedNavIds?: string[] | null;
  ariaLabel: string;
}) {
  const visible = actions.filter(
    (a) => allowedNavIds == null || allowedNavIds.includes(a.id),
  );

  if (visible.length === 0) return null;

  return (
    <nav
      aria-label={ariaLabel}
      className="shrink-0 border-b border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),transparent_8%)]"
    >
      <div className={SCROLLER}>
        {visible.map((a) => (
          <Link key={a.id} href={a.href} className={ACTION_CLASS}>
            <span className="text-base leading-none opacity-90" aria-hidden>
              {a.icon}
            </span>
            <span>{a.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
