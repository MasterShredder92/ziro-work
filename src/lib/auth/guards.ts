import { hasPermission } from "./permissions";
import { roleAtLeast, type Role } from "./roles";
import { getSession, type Session } from "./session";

export function requireRole(required: Role) {
  return async (): Promise<Session> => {
    const session = await getSession();
    if (!session) throw new Error("UNAUTHENTICATED");
    if (!roleAtLeast(session.role, required)) throw new Error("FORBIDDEN");
    return session;
  };
}

export function requirePermission(scope: string) {
  return async (): Promise<Session> => {
    const session = await getSession();
    if (!session) throw new Error("UNAUTHENTICATED");
    if (!hasPermission(session.role, scope)) throw new Error("FORBIDDEN");
    return session;
  };
}

export function assertRole(session: Session | null, required: Role): Session {
  if (!session) throw new Error("UNAUTHENTICATED");
  if (!roleAtLeast(session.role, required)) throw new Error("FORBIDDEN");
  return session;
}

export function assertPermission(session: Session | null, scope: string): Session {
  if (!session) throw new Error("UNAUTHENTICATED");
  if (!hasPermission(session.role, scope)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export async function assertTenantAccess(resourceTenantId: string): Promise<Session> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const expected = (resourceTenantId ?? "").trim();
  if (!expected) throw new Error("FORBIDDEN");
  const base = session.baseRole ?? session.role;
  if (base === "admin") return session;
  if (session.tenantId !== expected) throw new Error("FORBIDDEN");
  return session;
}

export function assertTenantMatch(
  session: Session | null,
  tenantId: string,
): Session {
  if (!session) throw new Error("UNAUTHENTICATED");
  const expected = (tenantId ?? "").trim();
  if (!expected) throw new Error("FORBIDDEN");
  const base = session.baseRole ?? session.role;
  if (base === "admin") return session;
  if (session.tenantId !== expected) throw new Error("FORBIDDEN");
  return session;
}
