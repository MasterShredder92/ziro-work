import "server-only";
import {
  assertTenantAccess,
  requirePermission,
  requireRole,
} from "@/lib/auth/guards";
import type { Session } from "@/lib/auth/session";
import { roleAtLeast } from "@/lib/auth/roles";

export type FormsContext = {
  session: Session;
  tenantId: string;
};

export async function resolveFormsContext(): Promise<FormsContext> {
  let session: Session;
  try {
    session = await requireRole("director")();
  } catch {
    session = await requireRole("admin")();
  }

  if (!roleAtLeast(session.role, "director")) {
    throw new Error("FORBIDDEN");
  }

  await requirePermission("forms.read")();
  await assertTenantAccess(session.tenantId);
  return { session, tenantId: session.tenantId };
}

export async function assertFormsWrite(): Promise<FormsContext> {
  const ctx = await resolveFormsContext();
  await requirePermission("forms.write")();
  return ctx;
}
