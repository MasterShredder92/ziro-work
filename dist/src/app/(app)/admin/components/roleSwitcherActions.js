"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSession, IMPERSONATE_COOKIE } from "@/lib/auth/session";
import { isRole, roleAtLeast } from "@/lib/auth/roles";
import { logAudit } from "@/lib/audit/log";
export async function setImpersonatedRoleAction(nextRole) {
    var _a;
    const session = await getSession();
    if (!session)
        throw new Error("FORBIDDEN");
    const base = (_a = session.baseRole) !== null && _a !== void 0 ? _a : session.role;
    if (base !== "admin" && base !== "director") {
        throw new Error("FORBIDDEN");
    }
    const store = await cookies();
    if (!nextRole || nextRole === "__clear__") {
        store.delete(IMPERSONATE_COOKIE);
        await logAudit("impersonate.clear", {
            userId: session.userId,
            baseRole: base,
        });
        revalidatePath("/admin");
        return;
    }
    if (!isRole(nextRole))
        throw new Error("INVALID_ROLE");
    const target = nextRole;
    if (roleAtLeast(target, base)) {
        throw new Error("CANNOT_IMPERSONATE_EQUAL_OR_HIGHER");
    }
    store.set(IMPERSONATE_COOKIE, target, {
        httpOnly: false,
        sameSite: "lax",
        path: "/",
    });
    await logAudit("impersonate.set", {
        userId: session.userId,
        baseRole: base,
        target,
    });
    revalidatePath("/admin");
}
