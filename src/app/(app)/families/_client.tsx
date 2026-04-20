"use client";

import Link from "next/link";
import { PageShell } from "@/components/layouts/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { useFamilies } from "@/hooks/data/useFamilies";
import { useTenantUi } from "@/components/tenant/TenantUiContext";
import { AgentPageBar } from "@/components/agentOS/AgentPageBar";

const PAGE = { mode: "offset" as const, page: 1, pageSize: 500 };

export function FamiliesClient() {
  const { tenantId, locationId, currentLocation } = useTenantUi();
  const familiesQuery = useFamilies({
    tenantId,
    page: PAGE,
    locationId: locationId || undefined,
  }, { enabled: Boolean(tenantId) });
  const count = familiesQuery.data?.items?.length ?? 0;
  const items = familiesQuery.data?.items ?? [];

  return (
    <PageShell title="Families / Accounts">
      <div className="mx-auto max-w-5xl space-y-[var(--z-space-6)]">
        <AgentPageBar agentId="stewie" chatPlaceholder="Ask Stewie about families…" pageContext={{ page: "families", count }} />
        <PageHeader
          title="Families / Accounts"
          subtitle={
            currentLocation
              ? `Accounts prioritized for ${currentLocation.name} (includes accounts with no primary location).`
              : "All locations for this tenant."
          }
        />
        {familiesQuery.error ? (
          <p className="text-sm text-[var(--z-danger)]">{familiesQuery.error.message}</p>
        ) : (
          <p className="text-sm text-[var(--z-muted)]">
            {familiesQuery.isLoading
              ? "Loading accounts…"
              : `${count} family accounts${currentLocation ? ` for ${currentLocation.name}` : " (all locations for this tenant)"}.`}
          </p>
        )}
        <p className="text-xs text-[var(--z-muted)]">
          Full table and billing context:{" "}
          <Link className="text-[var(--z-accent)] hover:underline" href="/crm/families">
            CRM → Families
          </Link>
          .
        </p>
        {!familiesQuery.isLoading && !familiesQuery.error && items.length > 0 ? (
          <ul className="divide-y divide-[var(--z-border,#1c1c1e)] overflow-hidden rounded-lg border border-[var(--z-border,#1c1c1e)] bg-[var(--z-surface,#0a0a0c)]">
            {items.map((row) => {
              const r = row as {
                id: string;
                name?: string | null;
                primary_email?: string | null;
              };
              const label = (r.name ?? "").trim() || "Unnamed account";
              return (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/crm/families/${encodeURIComponent(r.id)}`}
                      className="font-medium text-[var(--z-accent,#00ff88)] hover:underline"
                    >
                      {label}
                    </Link>
                    {r.primary_email ? (
                      <span className="ml-2 truncate text-xs text-[var(--z-muted,#909098)]">
                        {r.primary_email}
                      </span>
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

