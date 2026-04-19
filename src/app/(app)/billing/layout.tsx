import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/guards";
import { getPermissionsForRole } from "@/lib/auth/permissions";
import type { Session } from "@/lib/auth/session";
import { BILLING_NAV } from "./components/BillingSidebar";
import { BillingShell } from "./components/BillingShell";

export const dynamic = "force-dynamic";

async function resolveSession(): Promise<Session> {
  try {
    return await requirePermission("billing.read")();
  } catch {
    redirect("/dashboard");
  }
}

export default async function BillingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await resolveSession();

  if (session.role !== "admin" && session.role !== "director") {
    redirect("/dashboard");
  }

  const permissions = getPermissionsForRole(session.role);
  const allowedNavIds = BILLING_NAV.filter(
    (item) => !item.scope || permissions.includes(item.scope),
  ).map((item) => item.id);

  return (
    <BillingShell
      tenantName={session.tenantId}
      allowedNavIds={allowedNavIds}
    >
      {children}
    </BillingShell>
  );
}
