import type { ReactNode } from "react";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { requireRole, assertTenantAccess } from "@/lib/auth/guards";
import { can } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { LEADS_NAV, LeadsShell } from "./components";

export const dynamic = "force-dynamic";

async function resolveLeadsSession() {
  let session: Awaited<ReturnType<typeof getSession>> = null;
  try {
    session = await requireRole("director")();
    return session;
  } catch {
    try {
      session = await requireRole("admin")();
      return session;
    } catch {
      return null;
    }
  }
}

export default async function LeadsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await resolveLeadsSession();
  const tenantId = session?.tenantId ?? DEFAULT_TENANT_ID;

  if (session) {
    try {
      await assertTenantAccess(tenantId);
    } catch {
      return (
        <div className="mx-auto max-w-lg rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-8 text-center">
          <div className="text-base font-semibold text-[var(--z-fg)]">
            Forbidden
          </div>
          <p className="mt-2 text-sm text-[var(--z-muted)]">
            You do not have access to this tenant&apos;s leads.
          </p>
        </div>
      );
    }
  }

  const allowedNavIds = session
    ? LEADS_NAV.filter(
        (item) => !item.scope || can(session.role, item.scope),
      ).map((item) => item.id)
    : LEADS_NAV.map((item) => item.id);

  const roleLabel = session
    ? session.role.charAt(0).toUpperCase() + session.role.slice(1)
    : undefined;

  return (
    <LeadsShell
      tenantId={tenantId}
      roleLabel={roleLabel}
      allowedNavIds={allowedNavIds}
    >
      {children}
    </LeadsShell>
  );
}
