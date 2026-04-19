"use client";

export function ClientPageTitle({ title }: { title: string | undefined }) {
  const display = typeof title === "string" ? title : "";

  return (
    <p className="truncate text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--z-muted)]">
      {display}
    </p>
  );
}
