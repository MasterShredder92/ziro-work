/**
 * Progress OS integration for CRM. Surfaces a compact student-progress
 * summary that CRM pages can show without reaching into the Progress OS
 * internals.
 */
import { clientFor } from "@data/_client";

export type StudentProgressSummary = {
  goalsCount: number;
  completedGoals: number;
  skillsCount: number;
  lastEvidenceAt: string | null;
  lastCheckpointAt: string | null;
};

export async function getStudentProgressSummary(
  tenantId: string,
  studentId: string,
): Promise<StudentProgressSummary> {
  const supabase = await clientFor(tenantId);
  const summary: StudentProgressSummary = {
    goalsCount: 0,
    completedGoals: 0,
    skillsCount: 0,
    lastEvidenceAt: null,
    lastCheckpointAt: null,
  };

  try {
    const goals = await supabase
      .from("progress_goals")
      .select("id, status")
      .eq("tenant_id", tenantId)
      .eq("student_id", studentId);
    if (!goals.error && goals.data) {
      summary.goalsCount = goals.data.length;
      summary.completedGoals = goals.data.filter(
        (g) => (g.status as string) === "completed",
      ).length;
    }

    const skills = await supabase
      .from("progress_skills")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("student_id", studentId);
    if (!skills.error && skills.data) {
      summary.skillsCount = skills.data.length;
    }

    const evidence = await supabase
      .from("progress_evidence")
      .select("created_at")
      .eq("tenant_id", tenantId)
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(1);
    if (!evidence.error && evidence.data && evidence.data.length > 0) {
      summary.lastEvidenceAt = (evidence.data[0].created_at as string) ?? null;
    }

    const checkpoints = await supabase
      .from("progress_checkpoints")
      .select("created_at")
      .eq("tenant_id", tenantId)
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(1);
    if (!checkpoints.error && checkpoints.data && checkpoints.data.length > 0) {
      summary.lastCheckpointAt =
        (checkpoints.data[0].created_at as string) ?? null;
    }
  } catch {
    // Progress OS tables may not exist in all tenants; tolerate.
  }

  return summary;
}
