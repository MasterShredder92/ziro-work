import { getSupabaseTenant } from "@/lib/data/supabaseTenant";
/**
 * Single source of truth: is this tenant onboarded?
 *
 * Onboarded ⇔ the tenant has at least one student OR at least one teacher.
 *
 * Safe to call from Server Components, Route Handlers, Server Actions, and
 * middleware-adjacent server code. All queries go through the tenant-scoped
 * Supabase client which injects `x-tenant-id` on every request so RLS is
 * respected.
 */
export async function isTenantOnboarded(tenantId) {
    var _a, _b;
    const supabase = getSupabaseTenant(tenantId);
    const studentCount = await supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId);
    if (!studentCount.error && ((_a = studentCount.count) !== null && _a !== void 0 ? _a : 0) > 0) {
        return true;
    }
    const teacherCount = await supabase
        .from("teachers")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId);
    if (!teacherCount.error && ((_b = teacherCount.count) !== null && _b !== void 0 ? _b : 0) > 0) {
        return true;
    }
    return false;
}
