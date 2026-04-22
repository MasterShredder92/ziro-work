import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const tenantId = DEFAULT_TENANT_ID;
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    const todayEnd = new Date(now.setHours(23, 59, 59, 999)).toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const alerts: string[] = [];

    const { data: openBlocks } = await supabase
      .from("schedule_blocks")
      .select("id, start_time, location_name")
      .eq("tenant_id", tenantId)
      .eq("block_type", "open_time")
      .gte("start_time", todayStart)
      .lte("end_time", todayEnd);
    if (openBlocks && openBlocks.length > 0) {
      alerts.push(openBlocks.length + " open slot(s) on today schedule");
    }

    const { data: callouts } = await supabase
      .from("schedule_blocks")
      .select("id, teacher_id, start_time")
      .eq("tenant_id", tenantId)
      .eq("block_type", "call_out")
      .gte("start_time", todayStart)
      .lte("end_time", todayEnd);
    if (callouts && callouts.length > 0) {
      alerts.push(callouts.length + " teacher callout(s) today - students may need reassignment");
    }

    const { data: recentBlocks } = await supabase
      .from("schedule_blocks")
      .select("student_id")
      .eq("tenant_id", tenantId)
      .eq("block_type", "student_session")
      .gte("start_time", thirtyDaysAgo);
    const activeStudentIds = new Set(recentBlocks?.map((b: any) => b.student_id).filter(Boolean) || []);

    const { data: allActiveStudents } = await supabase
      .from("students")
      .select("id, first_name, last_name")
      .eq("tenant_id", tenantId)
      .eq("status", "active");
    const atRisk = allActiveStudents?.filter((s: any) => !activeStudentIds.has(s.id)) || [];
    if (atRisk.length > 0) {
      alerts.push(atRisk.length + " student(s) have not had a session in 30+ days");
    }

    const { data: overdueInvoices } = await supabase
      .from("invoices")
      .select("id, amount")
      .eq("tenant_id", tenantId)
      .eq("status", "overdue");
    if (overdueInvoices && overdueInvoices.length > 0) {
      const totalOverdue = overdueInvoices.reduce((sum: number, i: any) => sum + (i.amount || 0), 0);
      alerts.push(overdueInvoices.length + " overdue invoice(s) totaling $" + totalOverdue);
    }

    if (alerts.length > 0) {
      await supabase.from("agent_alerts").insert(
        alerts.map((alert: string) => ({
          tenant_id: tenantId,
          message: alert,
          agent_id: "heartbeat",
          created_at: new Date().toISOString(),
          status: "unread",
        }))
      );
    }

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      alertCount: alerts.length,
      alerts,
      message: alerts.length > 0
        ? "Heartbeat complete: " + alerts.length + " alert(s) generated"
        : "Heartbeat complete: All systems normal",
    });
  } catch (error: any) {
    console.error("[Heartbeat Error]:", error);
    return NextResponse.json({ error: "Heartbeat failed", details: error.message }, { status: 500 });
  }
}
