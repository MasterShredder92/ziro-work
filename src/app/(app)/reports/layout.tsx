import type { ReactNode } from "react";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { getSession } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/guards";
import { listReports } from "@/lib/reports/service";
import { ReportsShell } from "./components/ReportsShell";

export const dynamic = "force-dynamic";

export default async function ReportsLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Permission guard: admin, director, and teacher all hold reports.read
  // (teachers scoped to their own data by the data facades).
  let session: Awaited<ReturnType<typeof getSession>> = null;
  try {
    session = await requirePermission("reports.read")();
  } catch {
    session = null;
  }

  const tenantId = session?.tenantId ?? DEFAULT_TENANT_ID;
  const reports = await listReports();

  return (
    <ReportsShell reports={reports} tenantId={tenantId}>
      {children}
    </ReportsShell>
  );
}
