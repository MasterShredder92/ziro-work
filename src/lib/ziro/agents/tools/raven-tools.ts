/**
 * Raven Tool Definitions
 * 
 * Tools for analytics, insights, and trend detection.
 * Read-only — no approval required.
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function analyze_trends({
  studioId,
  metric,
  days = 30,
}: {
  studioId: string;
  metric: "attendance" | "revenue" | "new_students" | "cancellations";
  days?: number;
}) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  if (metric === "attendance") {
    const { data, error } = await supabase
      .from("lessons")
      .select("status, start_time")
      .eq("studio_id", studioId)
      .gte("start_time", since.toISOString());

    if (error) return { success: false, error: error.message };

    const total = data?.length || 0;
    const attended = data?.filter(l => l.status === "completed").length || 0;
    const cancelled = data?.filter(l => l.status === "cancelled").length || 0;
    const rate = total > 0 ? Math.round((attended / total) * 100) : 0;

    return {
      success: true,
      metric: "attendance",
      data: { total, attended, cancelled, attendanceRate: `${rate}%` },
      insight: rate >= 85 ? "Strong attendance" : rate >= 70 ? "Average attendance" : "Low attendance — action needed",
    };
  }

  if (metric === "new_students") {
    const { data, error } = await supabase
      .from("students")
      .select("id, created_at")
      .eq("studio_id", studioId)
      .gte("created_at", since.toISOString());

    if (error) return { success: false, error: error.message };

    return {
      success: true,
      metric: "new_students",
      data: { count: data?.length || 0, period: `${days} days` },
    };
  }

  return { success: false, error: "Metric not yet implemented" };
}

export async function predict_churn({
  studioId,
}: {
  studioId: string;
}) {
  // Students who haven't had a lesson in 30+ days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data, error } = await supabase
    .from("students")
    .select(`
      id, first_name, last_name, email,
      lessons:lessons(start_time, status)
    `)
    .eq("studio_id", studioId)
    .eq("status", "active");

  if (error) return { success: false, error: error.message };

  const atRisk = data?.filter(student => {
    const recentLessons = (student.lessons as any[])?.filter(
      l => new Date(l.start_time) > thirtyDaysAgo && l.status === "completed"
    );
    return !recentLessons || recentLessons.length === 0;
  }) || [];

  return {
    success: true,
    atRiskCount: atRisk.length,
    atRiskStudents: atRisk.map(s => ({
      id: s.id,
      name: `${s.first_name} ${s.last_name}`,
      email: s.email,
    })),
    message: `${atRisk.length} student(s) at risk of churning (no lessons in 30+ days)`,
  };
}

export async function generate_insights({ studioId }: { studioId: string }) {
  const [attendance, churn] = await Promise.all([
    analyze_trends({ studioId, metric: "attendance", days: 30 }),
    predict_churn({ studioId }),
  ]);

  const insights = [];

  if (attendance.success && attendance.data) {
    const rate = parseInt((attendance.data as any).attendanceRate);
    if (rate < 70) insights.push(`⚠️ Attendance is at ${rate}% — below target`);
    else insights.push(`✅ Attendance is strong at ${rate}%`);
  }

  if (churn.success && (churn.atRiskCount || 0) > 0) {
    insights.push(`⚠️ ${churn.atRiskCount} student(s) at risk of churning`);
  }

  return {
    success: true,
    insights,
    summary: insights.join("\n"),
  };
}

export const RAVEN_TOOLS = {
  analyze_trends,
  predict_churn,
  generate_insights,
};
