"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSession, IMPERSONATE_COOKIE } from "@/lib/auth/session";
import { isRole, roleAtLeast } from "@/lib/auth/roles";
import { logAudit } from "@/lib/audit/log";
const IMPERSONATABLE_ROLES = [
    "director",
    "teacher",
    "family",
    "student",
];
export async function setImpersonation(input) {
    var _a;
    const session = await getSession();
    if (!session)
        return { ok: false, error: "FORBIDDEN" };
    const base = (_a = session.baseRole) !== null && _a !== void 0 ? _a : session.role;
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
        if (input.path)
            revalidatePath(input.path);
        return { ok: true, role: null };
    }
    if (!isRole(input.role))
        return { ok: false, error: "INVALID_ROLE" };
    const target = input.role;
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
    if (input.path)
        revalidatePath(input.path);
    return { ok: true, role: target };
}
export async function clearImpersonation(input = {}) {
    var _a;
    const res = await setImpersonation({ role: null, path: (_a = input.path) !== null && _a !== void 0 ? _a : null });
    if (!res.ok)
        return { ok: false, error: res.error };
    return { ok: true };
}
