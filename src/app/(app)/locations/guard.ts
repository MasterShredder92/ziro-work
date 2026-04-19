import "server-only";
import {
  assertTenantAccess,
  requirePermission,
  requireRole,
} from "@/lib/auth/guards";
import type { Session } from "@/lib/auth/session";
import { roleAtLeast } from "@/lib/auth/roles";

export type LocationsContext = {
  session: Session;
  tenantId: string;
};

export async function resolveLocationsContext(): Promise<LocationsContext> {
  let session: Session;
  try {
    session = await requireRole("director")();
  } catch {
    session = await requireRole("admin")();
  }

  if (!roleAtLeast(session.role, "director")) {
    throw new Error("FORBIDDEN");
  }

  await requirePermission("locations.read")();
  await assertTenantAccess(session.tenantId);
  return { session, tenantId: session.tenantId };
}

export async function assertLocationsWrite(): Promise<LocationsContext> {
  const ctx = await resolveLocationsContext();
  await requirePermission("locations.write")();
  return ctx;
}
