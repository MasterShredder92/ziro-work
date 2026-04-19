import type { ReactNode } from "react";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { getSession } from "@/lib/auth/session";
import { canForRole } from "@/lib/auth/permissions";
import { ScheduleShell } from "./components/ScheduleShell";

export const dynamic = "force-dynamic";

export default async function ScheduleLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  const tenantId = session?.tenantId ?? DEFAULT_TENANT_ID;
  const canWrite = !!session && canForRole(session.role, "schedule.write");
  const tenantLabel = tenantId === DEFAULT_TENANT_ID ? "Workspace" : tenantId;

  return (
    <ScheduleShell tenantLabel={tenantLabel} canWrite={canWrite}>
      {children}
    </ScheduleShell>
  );
}
