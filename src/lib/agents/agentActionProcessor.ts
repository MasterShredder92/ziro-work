import { dequeueAction } from "./agentActionQueue";
import { runAction } from "./agentActionRunner";
import { markError, markIdle, markRunning } from "./agentLifecycle";
import { addHistoryEvent } from "./agentHistory";
import { getStudentStage } from "@/lib/lifecycle/getStudentStage";
import type { AgentAction } from "./agentActionTypes";

function readStudentIdFromInput(input: unknown): string | null {
  if (!input || typeof input !== "object") return null;
  const o = input as Record<string, unknown>;
  if (typeof o.student_id === "string") return o.student_id;
  if (typeof o.studentId === "string") return o.studentId;
  return null;
}

export async function processNextAction(): Promise<string | null> {
  try {
    const item = dequeueAction();
    if (!item) return null;

    const { agentId, action } = item;

    try {
      markRunning(agentId);
      const result = await runAction(action);

      if (result.ok) {
        markIdle(agentId);
        addHistoryEvent(agentId, "action_success");
      } else {
        markError(agentId);
        addHistoryEvent(agentId, "action_error", result.error);
      }

      const studentId = readStudentIdFromInput((action as AgentAction).input);
      if (studentId) {
        try {
          await getStudentStage(studentId);
        } catch (err) {
          console.error("[LIFECYCLE] Failed to recompute stage after action:", err);
        }
      }
    } catch (err) {
      markError(agentId);
      addHistoryEvent(agentId, "action_error", err);
    }

    return agentId;
  } catch {
    return null;
  }
}

