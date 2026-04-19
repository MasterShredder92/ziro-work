"use client";

import { PageShell } from "@/components/layouts/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { useTeachers } from "@/hooks/data/useTeachers";
import { useTenantUi } from "@/components/tenant/TenantUiContext";

const PAGE = { mode: "offset" as const, page: 1, pageSize: 400 };

export function TeachersClient() {
  const { tenantId, locationId, currentLocation } = useTenantUi();
  const teachersQuery = useTeachers({
    tenantId,
    page: PAGE,
    status: "active",
    locationId: locationId || undefined,
  }, { enabled: Boolean(tenantId) });
  const count = teachersQuery.data?.items?.length ?? 0;

  return (
    <PageShell title="Teachers">
      <div className="mx-auto max-w-5xl space-y-[var(--z-space-6)]">
        <PageHeader
          title="Teachers"
          subtitle={
            currentLocation
              ? `Assignments scoped to ${currentLocation.name}.`
              : "No locations configured."
          }
        />
        {teachersQuery.error ? (
          <p className="text-sm text-[var(--z-danger)]">{teachersQuery.error.message}</p>
        ) : (
          <p className="text-sm text-[var(--z-muted)]">
            {teachersQuery.isLoading ? "Loading directory…" : `${count} active teachers (UI shell).`}
          </p>
        )}
      </div>
    </PageShell>
  );
}
