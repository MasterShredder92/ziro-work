import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { can } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { assertTenantAccess } from "@/lib/auth/guards";
import {
  TEMPLATES_NAV_ITEMS,
  TemplatesShell,
} from "./components";

export default async function TemplatesLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/templates");

  const canRead = can(session.role, "templates.read");
  const isPrivileged = session.role === "admin" || session.role === "director";
  if (!canRead || !isPrivileged) {
    redirect("/");
  }

  const tenantId = session.tenantId?.trim() || DEFAULT_TENANT_ID;
  await assertTenantAccess(tenantId);

  const allowedNavIds = TEMPLATES_NAV_ITEMS.filter(
    (item) => !item.scope || can(session.role, item.scope),
  ).map((i) => i.id);

  const currentUserName = session.userId ?? null;

  return (
    <TemplatesShell
      allowedNavIds={allowedNavIds}
      currentUserName={currentUserName}
    >
      {children}
    </TemplatesShell>
  );
}
