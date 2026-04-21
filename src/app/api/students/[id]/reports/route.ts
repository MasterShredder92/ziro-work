import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { resolveCRMContext } from "../../crm/_context";
import { ok, serverError, notFound } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.read"],
    minRole: "student",
  });
  if ("response" in resolved) return resolved.response;

  try {
    const { id: studentId } = await ctx.params;
    const supabase = getServiceClient();

    const { data, error } = await supabase
      .from("championship_reports")
      .select("*")
      .eq("tenant_id", resolved.context.tenantId)
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) return serverError(error);
    if (!data || data.length === 0) return notFound();

    return ok({ data });
  } catch (err) {
    return serverError(err);
  }
}
