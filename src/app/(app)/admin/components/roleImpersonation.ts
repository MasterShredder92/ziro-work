"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSession, IMPERSONATE_COOKIE } from "@/lib/auth/session";
import { isRole, roleAtLeast, type Role } from "@/lib/auth/roles";
import { logAudit } from "@/lib/audit/log";

const IMPERSONATABLE_ROLES: Role[] = [
  "director",
  "teacher",
  "family",
  "student",
];

export type SetImpersonationInput = {
  role: string | null;
  path?: string | null;
};

export async function setImpersonation(
  input: SetImpersonationInput,
): Promise<{ ok: true; role: Role | null } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "FORBIDDEN" };
  const base = session.baseRole ?? session.role;
  if (base !== "admin" && base !== "director") {
    return { ok: false, error: "FORBIDDEN" };
  }

  const store = await cookies();

  if (!input.role) {
    store.set({
      name: IMPERSONATE_COOKIE,
      value: "",
      path: "/",
      maxAge: 0,
      httpOnly: true,
      sameSite: "lax",
    });
    await logAudit("auth.impersonate.clear", { by: session.userId });
    if (input.path) revalidatePath(input.path);
    return { ok: true, role: null };
  }

  if (!isRole(input.role)) return { ok: false, error: "INVALID_ROLE" };
  const target = input.role as Role;

  if (!IMPERSONATABLE_ROLES.includes(target)) {
    return { ok: false, error: "INVALID_ROLE" };
  }

  if (roleAtLeast(target, base)) {
    return { ok: false, error: "FORBIDDEN" };
  }

  store.set({
    name: IMPERSONATE_COOKIE,
    value: target,
    path: "/",
    maxAge: 60 * 60 * 8,
    httpOnly: true,
    sameSite: "lax",
  });
  await logAudit("auth.impersonate.set", { by: session.userId, target });
  if (input.path) revalidatePath(input.path);
  return { ok: true, role: target };
}

export async function clearImpersonation(
  input: { path?: string | null } = {},
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await setImpersonation({ role: null, path: input.path ?? null });
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true };
}
