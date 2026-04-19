import type { ReactNode } from "react";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { getSession } from "@/lib/auth/session";
import { getPermissionsForRole } from "@/lib/auth/permissions";
import { resolveContentContext } from "./guard";
import { ContentShell, CONTENT_NAV } from "./components";

export const dynamic = "force-dynamic";

export default async function ContentLayout({
  children,
}: {
  children: ReactNode;
}) {
  let tenantId = DEFAULT_TENANT_ID;
  let tenantLabel = "Workspace";
  let allowedNavIds: string[] | null = null;

  try {
    const ctx = await resolveContentContext();
    tenantId = ctx.tenantId;
    tenantLabel = ctx.session.tenantId ? ctx.session.tenantId : "Workspace";
    const permissions = getPermissionsForRole(ctx.session.role);
    allowedNavIds = CONTENT_NAV.filter(
      (item) => !item.scope || permissions.includes(item.scope),
    ).map((item) => item.id);
  } catch {
    const session = await getSession();
    tenantId = session?.tenantId ?? DEFAULT_TENANT_ID;
  }
  void tenantId;

  return (
    <ContentShell tenantLabel={tenantLabel} allowedNavIds={allowedNavIds}>
      {children}
    </ContentShell>
  );
}
