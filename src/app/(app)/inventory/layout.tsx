import type { ReactNode } from "react";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { assertTenantAccess, requireRole } from "@/lib/auth/guards";
import { can } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { INVENTORY_NAV, InventoryShell } from "./components";

export const dynamic = "force-dynamic";

async function resolveInventorySession() {
  const roles: Array<"director" | "admin" | "teacher"> = [
    "director",
    "admin",
    "teacher",
  ];
  for (const role of roles) {
    try {
      const session = await requireRole(role)();
      if (session) return session;
    } catch {
      /* try next */
    }
  }
  return null;
}

export default async function InventoryLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = (await resolveInventorySession()) ?? (await getSession());
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
            You do not have access to this tenant&apos;s inventory.
          </p>
        </div>
      );
    }
  }

  const allowedNavIds = session
    ? INVENTORY_NAV.filter(
        (item) => !item.scope || can(session.role, item.scope),
      ).map((item) => item.id)
    : INVENTORY_NAV.map((item) => item.id);

  const roleLabel = session
    ? session.role.charAt(0).toUpperCase() + session.role.slice(1)
    : undefined;

  return (
    <InventoryShell
      tenantLabel={tenantId}
      roleLabel={roleLabel}
      allowedNavIds={allowedNavIds}
    >
      {children}
    </InventoryShell>
  );
}
