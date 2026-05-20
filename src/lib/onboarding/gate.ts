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
export async function isTenantOnboarded(tenantId: string): Promise<boolean> {
  try {
    const supabase = await getSupabaseTenant(tenantId);

    const studentCount = await supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId);

    if (!studentCount.error && (studentCount.count ?? 0) > 0) {
      return true;
    }

    const teacherCount = await supabase
      .from("teachers")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId);

    if (!teacherCount.error && (teacherCount.count ?? 0) > 0) {
      return true;
    }

    return false;
  } catch (err) {
    console.error("[isTenantOnboarded] failed; assuming onboarded", err);
    return true;
  }
}
