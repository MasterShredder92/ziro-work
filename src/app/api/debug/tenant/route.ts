import { NextResponse } from "next/server";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { getSupabaseTenant } from "@/lib/data/supabaseTenant";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function countFor(
  supabase: Awaited<ReturnType<typeof getSupabaseTenant>>,
  table: string,
  tenantId: string,
): Promise<{ count: number | null; error: string | null }> {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);
  return {
    count: count ?? null,
    error: error ? error.message : null,
  };
}

export async function GET() {
  const tenantId = DEFAULT_TENANT_ID;
  const supabase = await getSupabaseTenant(tenantId);

  const [students, teachers, families, enrollments, schedules] = await Promise.all([
    countFor(supabase, "students", tenantId),
    countFor(supabase, "teachers", tenantId),
    countFor(supabase, "families", tenantId),
    countFor(supabase, "enrollments", tenantId),
    countFor(supabase, "schedules", tenantId),
  ]);

  return NextResponse.json({
    tenantId,
    students,
    teachers,
    families,
    enrollments,
    schedules,
  });
}
