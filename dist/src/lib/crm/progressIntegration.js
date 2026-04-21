/**
 * Progress OS integration for CRM. Surfaces a compact student-progress
 * summary that CRM pages can show without reaching into the Progress OS
 * internals.
 */
import { clientFor } from "@data/_client";
export async function getStudentProgressSummary(tenantId, studentId) {
    var _a, _b;
    const supabase = clientFor(tenantId);
    const summary = {
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
            summary.completedGoals = goals.data.filter((g) => g.status === "completed").length;
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
            summary.lastEvidenceAt = (_a = evidence.data[0].created_at) !== null && _a !== void 0 ? _a : null;
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
                (_b = checkpoints.data[0].created_at) !== null && _b !== void 0 ? _b : null;
        }
    }
    catch (_c) {
        // Progress OS tables may not exist in all tenants; tolerate.
    }
    return summary;
}
