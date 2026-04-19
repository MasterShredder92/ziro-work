import { runSafe } from "./agentSandbox";
import { getAction } from "./agentActionRegistry";
import type { AgentAction, AgentActionError, AgentActionResult } from "./agentActionTypes";

export async function runAction(
  action: AgentAction
): Promise<AgentActionResult | AgentActionError> {
  try {
    const handler = getAction(action.agentId, action.name);
    if (!handler) {
      return {
        actionId: action.id,
        ok: false,
        error: new Error("Unknown action"),
        finishedAt: Date.now(),
      };
    }

    const out = await runSafe(() => handler(action.input));
    const finishedAt = Date.now();

    if (out.ok) {
      return {
        actionId: action.id,
        ok: true,
        output: out.result,
        finishedAt,
      };
    }

    return {
      actionId: action.id,
      ok: false,
      error: out.error,
      finishedAt,
    };
  } catch (error) {
    return {
      actionId: action.id,
      ok: false,
      error,
      finishedAt: Date.now(),
    };
  }
}

