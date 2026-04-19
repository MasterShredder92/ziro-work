"use client";

import Link from "next/link";
import { PageShell } from "@/components/layouts/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { useStudents } from "@/hooks/data/useStudents";
import { useTenantUi } from "@/components/tenant/TenantUiContext";

const PAGE = { mode: "offset" as const, page: 1, pageSize: 500 };

export function StudentsClient() {
  const { tenantId, locationId, currentLocation } = useTenantUi();
  const studentsQuery = useStudents({
    tenantId,
    page: PAGE,
    locationId: locationId || undefined,
  }, { enabled: Boolean(tenantId) });
  const count = studentsQuery.data?.items?.length ?? 0;
  const items = studentsQuery.data?.items ?? [];

  return (
    <PageShell title="Students">
      <div className="mx-auto max-w-5xl space-y-[var(--z-space-6)]">
        <PageHeader
          title="Students"
          subtitle={
            currentLocation
              ? `Roster scoped to ${currentLocation.name} (includes rows with no location).`
              : "All locations for this tenant (no location picker yet)."
          }
        />
        {studentsQuery.error ? (
          <p className="text-sm text-[var(--z-danger)]">{studentsQuery.error.message}</p>
        ) : (
          <p className="text-sm text-[var(--z-muted)]">
            {studentsQuery.isLoading ? "Loading roster…" : `${count} students loaded for this tenant.`}
          </p>
        )}
        <p className="text-xs text-[var(--z-muted)]">
          For sorting, bulk actions, and inline edits use{" "}
          <Link className="text-[var(--z-accent)] hover:underline" href="/crm/students">
            CRM → Students
          </Link>
          .
        </p>
        {!studentsQuery.isLoading && !studentsQuery.error && items.length > 0 ? (
          <ul className="divide-y divide-[var(--z-border,#1c1c1e)] overflow-hidden rounded-lg border border-[var(--z-border,#1c1c1e)] bg-[var(--z-surface,#0a0a0c)]">
            {items.map((row) => {
              const r = row as {
                id: string;
                first_name?: string | null;
                last_name?: string | null;
                status?: string | null;
              };
              const name =
                `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || "Unnamed student";
              return (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/crm/students/${encodeURIComponent(r.id)}`}
                      className="font-medium text-[var(--z-accent,#00ff88)] hover:underline"
                    >
                      {name}
                    </Link>
                    {r.status ? (
                      <span className="ml-2 text-xs text-[var(--z-muted,#909098)]">{r.status}</span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </PageShell>
  );
}
