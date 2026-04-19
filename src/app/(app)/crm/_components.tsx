import Link from "next/link";
import type { ReactNode } from "react";

export { TableShell } from "./table-shell";
export type { TableShellProps } from "./table-shell";

export function CRMLayout({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="h-full overflow-y-auto overflow-x-hidden p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-[var(--z-muted-2,#606068)]">
            CRM OS
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--z-fg,#f0f0f0)]">
            {title}
          </h1>
          {subtitle ? (
            <div className="mt-1 text-sm text-[var(--z-muted,#909098)]">
              {subtitle}
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
      {children}
    </div>
  );
}

export function CRMNav({ current }: { current: string }) {
  const items: Array<{ href: string; label: string; id: string }> = [
    { id: "home", href: "/crm", label: "Dashboard" },
    { id: "contacts", href: "/crm/contacts", label: "Contacts" },
    { id: "students", href: "/crm/students", label: "Students" },
    { id: "families", href: "/crm/families", label: "Families" },
    { id: "teachers", href: "/crm/teachers", label: "Teachers" },
    { id: "enrollments", href: "/crm/enrollments", label: "Enrollments" },
    { id: "leads", href: "/crm/leads", label: "Leads" },
  ];
  return (
    <nav className="mb-6 flex flex-wrap items-center gap-1 border-b border-[#1c1c1e] pb-2">
      {items.map((it) => (
        <Link
          key={it.id}
          href={it.href}
          className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
            it.id === current
              ? "bg-[var(--z-accent,#00ff88)]/10 text-[var(--z-accent,#00ff88)]"
              : "text-[var(--z-muted,#909098)] hover:bg-white/5 hover:text-white"
          }`}
        >
          {it.label}
        </Link>
      ))}
    </nav>
  );
}

export function KpiTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--z-border,#1c1c1e)] bg-[var(--z-surface,#0a0a0c)] p-4">
      <div className="text-xs uppercase tracking-wider text-[var(--z-muted-2,#606068)]">
        {label}
      </div>
      <div className="mt-1 text-2xl font-extrabold text-[var(--z-fg,#f0f0f0)]">
        {value}
      </div>
      {hint ? (
        <div className="mt-1 text-xs text-[var(--z-muted,#707078)]">{hint}</div>
      ) : null}
    </div>
  );
}

export function KpiSkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border border-[var(--z-border,#1c1c1e)] bg-[var(--z-surface,#0a0a0c)] p-4"
        >
          <div className="h-3 w-24 rounded bg-white/10" />
          <div className="mt-3 h-8 w-16 rounded bg-white/10" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({
  rows = 5,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--z-border,#1c1c1e)] bg-[var(--z-surface,#0a0a0c)]">
      <div className="border-b border-[var(--z-border,#1c1c1e)] p-3">
        <div className="flex gap-2">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-3 flex-1 animate-pulse rounded bg-white/10" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-[var(--z-border,#1c1c1e)]">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-2 px-4 py-3">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className="h-3 flex-1 animate-pulse rounded bg-white/10"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  body,
}: {
  title: string;
  body?: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--z-border,#1c1c1e)] bg-[var(--z-surface,#0a0a0c)] p-8 text-center">
      <div className="text-sm font-semibold text-[var(--z-fg-muted,#d4d4d4)]">
        {title}
      </div>
      {body ? (
        <div className="mt-2 text-xs text-[var(--z-muted,#909098)]">{body}</div>
      ) : null}
    </div>
  );
}

export function PageErrorState({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="text-lg font-semibold text-[var(--z-fg,#f0f0f0)]">
        {title}
      </div>
      <p className="max-w-md text-sm text-[var(--z-muted,#909098)]">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md bg-[var(--z-accent,#00ff88)]/15 px-4 py-2 text-sm font-semibold text-[var(--z-accent,#00ff88)] hover:bg-[var(--z-accent,#00ff88)]/25"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
