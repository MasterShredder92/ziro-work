import { runSafe } from "./agentSandbox";
import { saveTaskResult } from "./agentTaskResults";
import type { AgentTask, AgentTaskError, AgentTaskResult } from "./agentTaskTypes";
import { getStudentStage } from "@/lib/lifecycle/getStudentStage";

export async function runTask(task: AgentTask, fn: () => Promise<unknown>): Promise<void> {
  try {
    const out = await runSafe(fn);
    const finishedAt = Date.now();

    if (out.ok) {
      const result: AgentTaskResult = {
        taskId: task.id,
        ok: true,
        result: out.result,
        finishedAt,
      };
      saveTaskResult(result);

      const payload =
        task.payload && typeof task.payload === "object"
          ? (task.payload as Record<string, unknown>)
          : null;
      const studentId: string | null =
        payload && typeof payload.student_id === "string"
          ? payload.student_id
          : payload && typeof payload.studentId === "string"
            ? payload.studentId
            : null;
      if (studentId) {
        try {
          await getStudentStage(studentId);
        } catch (err) {
          console.error("[LIFECYCLE] Failed to recompute stage after task:", err);
        }
      }
      return;
    }

    const error: AgentTaskError = {
      taskId: task.id,
      ok: false,
      error: out.error,
      finishedAt,
    };
    saveTaskResult(error);
  } catch {
    // Does not throw
  }
}

