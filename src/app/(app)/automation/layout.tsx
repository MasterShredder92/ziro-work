import type { ReactNode } from "react";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { getSession } from "@/lib/auth/session";
import { canForRole } from "@/lib/auth/permissions";
import { AutomationShell } from "./components/AutomationShell";

export default async function AutomationLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  const tenantId = session?.tenantId ?? DEFAULT_TENANT_ID;

  if (!session) {
    return (
      <div className="p-10 text-center">
        <div className="text-base font-semibold text-[var(--z-fg)]">
          Forbidden
        </div>
        <div className="mt-2 text-sm text-[var(--z-muted)]">
          Sign in to view Automation OS.
        </div>
      </div>
    );
  }

  if (!canForRole(session.role, "automation.read")) {
    return (
      <div className="p-10 text-center">
        <div className="text-base font-semibold text-[var(--z-fg)]">
          Forbidden
        </div>
        <div className="mt-2 text-sm text-[var(--z-muted)]">
          Your role does not have automation.read permission.
        </div>
      </div>
    );
  }

  return (
    <AutomationShell tenantId={tenantId}>
      {children}
    </AutomationShell>
  );
}
