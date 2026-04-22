import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * Agent Heartbeat Route
 * 
 * Called by Vercel Cron every 30 minutes.
 * Proactively checks for issues and alerts the owner.
 * 
 * Checks:
 * - Scheduling conflicts in the next 24 hours
 * - Students at risk of churning
 * - Overdue invoices
 * - Instructor availability gaps
 * 
 * This is the "Proactive Heartbeat" from the PaperclipAI pattern.
 */
export async function GET(req: NextRequest) {
  // Verify this is a legitimate cron request
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );

  const alerts: string[] = [];
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  try {
    // Check 1: Lessons with no instructor assigned in next 24 hours
    const { data: unassignedLessons } = await supabase
      .from("lessons")
      .select("id, start_time, student:students(first_name, last_name)")
      .is("instructor_id", null)
      .gte("start_time", now.toISOString())
      .lte("start_time", in24Hours.toISOString())
      .neq("status", "cancelled");

    if (unassignedLessons && unassignedLessons.length > 0) {
      alerts.push(`⚠️ ${unassignedLessons.length} lesson(s) in next 24h have no instructor assigned`);
    }

    // Check 2: Students with no lessons in 30+ days (churn risk)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const { data: recentLessons } = await supabase
      .from("lessons")
      .select("student_id")
      .gte("start_time", thirtyDaysAgo.toISOString())
      .eq("status", "completed");

    const activeStudentIds = new Set(recentLessons?.map(l => l.student_id) || []);

    const { data: allActiveStudents } = await supabase
      .from("students")
      .select("id, first_name, last_name")
      .eq("status", "active");

    const atRisk = allActiveStudents?.filter(s => !activeStudentIds.has(s.id)) || [];
    if (atRisk.length > 0) {
      alerts.push(`⚠️ ${atRisk.length} student(s) haven't had a lesson in 30+ days`);
    }

    // Check 3: Overdue invoices
    const { data: overdueInvoices } = await supabase
      .from("invoices")
      .select("id, amount")
      .eq("status", "overdue");

    if (overdueInvoices && overdueInvoices.length > 0) {
      const totalOverdue = overdueInvoices.reduce((sum, i) => sum + i.amount, 0);
      alerts.push(`💰 ${overdueInvoices.length} overdue invoice(s) totaling $${totalOverdue}`);
    }

    // Store alerts in the database for the dashboard to display
    if (alerts.length > 0) {
      await supabase.from("agent_alerts").insert(
        alerts.map(alert => ({
          message: alert,
          agent_id: "heartbeat",
          created_at: new Date().toISOString(),
          status: "unread",
        }))
      );
    }

    return NextResponse.json({
      ok: true,
      timestamp: now.toISOString(),
      alertCount: alerts.length,
      alerts,
      message: alerts.length > 0
        ? `Heartbeat complete: ${alerts.length} alert(s) generated`
        : "Heartbeat complete: All systems normal",
    });

  } catch (error: any) {
    console.error("[Heartbeat Error]:", error);
    return NextResponse.json({ error: "Heartbeat failed", details: error.message }, { status: 500 });
  }
}
