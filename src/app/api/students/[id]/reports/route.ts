import { NextRequest, NextResponse } from "next/server";
import { createTenantBoundSupabaseClient } from "@/lib/supabaseAuthenticated";
import { getCRMTenantId } from "@/app/(app)/crm/_tenant";
import { ok, serverError, notFound } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const tenantId = await getCRMTenantId();
    const { id: studentId } = await ctx.params;
    const supabase = await createTenantBoundSupabaseClient({ tenantId });

    const { data, error } = await supabase
      .from("championship_reports")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) return serverError(error);
    return ok({ data: data || [] });
  } catch (err) {
    return serverError(err);
  }
}
