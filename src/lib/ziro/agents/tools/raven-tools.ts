/**
 * Raven Tool Definitions — SOVEREIGN SCHEMA
 *
 * Tools for analytics, insights, communication, and trend detection.
 * All queries use tenant_id isolation and schedule_blocks (not lessons).
 */

import { createClient } from "@supabase/supabase-js";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

const TENANT_ID = DEFAULT_TENANT_ID;

export async function analyze_trends({
  metric,
  days = 30,
}: {
  metric: "attendance" | "revenue" | "new_students" | "cancellations";
  days?: number;
}) {
  const supabase = getSupabase();
  const since = new Date();
  since.setDate(since.getDate() - days);

  if (metric === "attendance") {
    const { data, error } = await supabase
      .from("schedule_blocks")
      .select("status, start_time, block_type")
      .eq("tenant_id", TENANT_ID)
      .eq("block_type", "student_session")
      .gte("start_time", since.toISOString());

    if (error) return { success: false, error: error.message };

    const total = data?.length || 0;
    const attended = data?.filter((b: any) => b.status === "completed").length || 0;
    const cancelled = data?.filter((b: any) => b.status === "cancelled").length || 0;
    const rate = total > 0 ? Math.round((attended / total) * 100) : 0;

    return {
      success: true,
      metric: "attendance",
      data: { total, attended, cancelled, attendanceRate: rate + "%" },
      insight:
        rate >= 85
          ? "Strong attendance"
          : rate >= 70
          ? "Average attendance"
          : "Low attendance — action needed",
    };
  }

  if (metric === "new_students") {
    const { data, error } = await supabase
      .from("students")
      .select("id, created_at")
      .eq("tenant_id", TENANT_ID)
      .gte("created_at", since.toISOString());

    if (error) return { success: false, error: error.message };

    return {
      success: true,
      metric: "new_students",
      data: { count: data?.length || 0, period: days + " days" },
    };
  }

  return { success: false, error: "Metric not yet implemented" };
}

export async function predict_churn() {
  const supabase = getSupabase();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: recentBlocks } = await supabase
    .from("schedule_blocks")
    .select("student_id")
    .eq("tenant_id", TENANT_ID)
    .eq("block_type", "student_session")
    .eq("status", "completed")
    .gte("start_time", thirtyDaysAgo.toISOString());

  const activeStudentIds = new Set(
    recentBlocks?.map((b: any) => b.student_id).filter(Boolean) || []
  );

  const { data: allActiveStudents, error } = await supabase
    .from("students")
    .select("id, first_name, last_name, email")
    .eq("tenant_id", TENANT_ID)
    .eq("status", "active");

  if (error) return { success: false, error: error.message };

  const atRisk =
    allActiveStudents?.filter((s: any) => !activeStudentIds.has(s.id)) || [];

  return {
    success: true,
    atRiskCount: atRisk.length,
    atRiskStudents: atRisk.map((s: any) => ({
      id: s.id,
      name: s.first_name + " " + s.last_name,
      email: s.email,
    })),
    message:
      atRisk.length + " student(s) at risk of churning (no sessions in 30+ days)",
  };
}

export async function generate_insights() {
  const [attendance, churn] = await Promise.all([
    analyze_trends({ metric: "attendance", days: 30 }),
    predict_churn(),
  ]);

  const insights: string[] = [];

  if (attendance.success && attendance.data) {
    const rate = parseInt((attendance.data as any).attendanceRate);
    if (rate < 70) insights.push("Attendance is at " + rate + "% — below target");
    else insights.push("Attendance is strong at " + rate + "%");
  }

  if (churn.success && (churn.atRiskCount || 0) > 0) {
    insights.push(churn.atRiskCount + " student(s) at risk of churning");
  }

  return {
    success: true,
    insights,
    summary: insights.join("\n"),
  };
}

export async function send_sms({
  studentId,
  message,
}: {
  studentId: string;
  message: string;
}) {
  const supabase = getSupabase();
  const { data: student } = await supabase
    .from("students")
    .select("phone, first_name, last_name")
    .eq("id", studentId)
    .eq("tenant_id", TENANT_ID)
    .single();

  if (!student?.phone) return { success: false, error: "No phone number found for this student" };

  // SMS delivery logic (Twilio/etc.) would go here
  console.log("[Raven SMS] To:", student.phone, "| Message:", message);

  return {
    success: true,
    sentTo: student.phone,
    studentName: student.first_name + " " + student.last_name,
    message,
  };
}

export async function send_email({
  studentId,
  subject,
  body,
}: {
  studentId: string;
  subject: string;
  body: string;
}) {
  const supabase = getSupabase();
  const { data: student } = await supabase
    .from("students")
    .select("email, first_name, last_name")
    .eq("id", studentId)
    .eq("tenant_id", TENANT_ID)
    .single();

  if (!student?.email) return { success: false, error: "No email found for this student" };

  // Email delivery logic (SendGrid/etc.) would go here
  console.log("[Raven Email] To:", student.email, "| Subject:", subject);

  return {
    success: true,
    sentTo: student.email,
    studentName: student.first_name + " " + student.last_name,
    subject,
  };
}

export const RAVEN_TOOLS = {
  analyze_trends,
  predict_churn,
  generate_insights,
  send_sms,
  send_email,
};
