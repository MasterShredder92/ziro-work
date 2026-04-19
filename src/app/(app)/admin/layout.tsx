import type { ReactNode } from "react";
import { headers } from "next/headers";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { listAdminLocations, listAdminTenants } from "@/lib/admin/tenants";
import { can } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { ADMIN_NAV_ITEMS, AdminShell } from "./_nav";
import { RoleSwitcher } from "./components/RoleSwitcher";

async function resolveAdminTenantId(): Promise<string> {
  const h = await headers();
  const fromHeader = h.get("x-tenant-id");
  if (fromHeader && fromHeader.trim().length > 0) return fromHeader.trim();
  return DEFAULT_TENANT_ID;
}

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const tenantId = await resolveAdminTenantId();
  const [tenants, locations, session] = await Promise.all([
    listAdminTenants(),
    listAdminLocations(tenantId),
    getSession(),
  ]);

  const tenantOptions =
    tenants.length > 0 ? tenants : [{ id: tenantId, name: "Default tenant" }];

  const allowedNavHrefs: string[] = session
    ? ADMIN_NAV_ITEMS.filter(
        (item) => !item.scope || can(session.role, item.scope),
      ).map((item) => item.href)
    : ADMIN_NAV_ITEMS.map((item) => item.href);

  const baseRole = session?.baseRole ?? session?.role ?? null;
  const headerExtras =
    session && (baseRole === "admin" || baseRole === "director") ? (
      <RoleSwitcher
        baseRole={baseRole}
        currentRole={session.role}
        isImpersonating={!!session.isImpersonating}
      />
    ) : null;

  return (
    <AdminShell
      tenantId={tenantId}
      tenants={tenantOptions}
      locations={locations}
      allowedNavHrefs={allowedNavHrefs}
      headerExtras={headerExtras}
    >
      {children}
    </AdminShell>
  );
}
