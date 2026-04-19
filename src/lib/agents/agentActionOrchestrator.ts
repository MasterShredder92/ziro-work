import { getStudentStage } from "@/lib/lifecycle/getStudentStage";
import { createAction } from "./agentActionFactory";
import type { AgentActionError, AgentActionResult } from "./agentActionTypes";
import { runAction } from "./agentActionRunner";
import { saveAction } from "./agentActionStore";

function readStudentIdFromInput(input: unknown): string | null {
  if (!input || typeof input !== "object") return null;
  const o = input as Record<string, unknown>;
  if (typeof o.student_id === "string") return o.student_id;
  if (typeof o.studentId === "string") return o.studentId;
  return null;
}

export async function executeAgentAction(
  agentId: string,
  name: string,
  input: unknown
): Promise<AgentActionResult | AgentActionError> {
  try {
    const action = createAction(agentId, name, input);
    saveAction(action);

    const result = await runAction(action);

    const studentId = readStudentIdFromInput(input);

    if (studentId) {
      try {
        await getStudentStage(studentId);
      } catch (err) {
        console.error("[LIFECYCLE] Failed to recompute stage after executeAgentAction:", err);
      }
    }

    return result;
  } catch (error) {
    return {
      actionId: crypto.randomUUID(),
      ok: false,
      error,
      finishedAt: Date.now(),
    };
  }
}

