import type { ReactNode } from "react";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { getSession } from "@/lib/auth/session";
import { resolveLessonPlannerContext } from "./guard";
import { LessonPlannerShell } from "./components";

export const dynamic = "force-dynamic";

export default async function LessonPlannerLayout({
  children,
}: {
  children: ReactNode;
}) {
  let tenantId = DEFAULT_TENANT_ID;
  let tenantLabel = "Workspace";
  try {
    const ctx = await resolveLessonPlannerContext();
    tenantId = ctx.tenantId;
    tenantLabel = ctx.session.tenantId ? ctx.session.tenantId : "Workspace";
  } catch {
    const session = await getSession();
    tenantId = session?.tenantId ?? DEFAULT_TENANT_ID;
    tenantLabel = "Workspace";
  }
  void tenantId;

  return (
    <LessonPlannerShell tenantLabel={tenantLabel}>{children}</LessonPlannerShell>
  );
}
