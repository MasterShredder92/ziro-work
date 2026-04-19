import { createAction } from "./agentActionFactory";
import { enqueueAction } from "./agentActionQueue";
import { processNextAction } from "./agentActionProcessor";

export function queueAgentAction(agentId: string, name: string, input: unknown): void {
  const action = createAction(agentId, name, input);
  enqueueAction(agentId, action);
}

export async function runOneAction(): Promise<string | null> {
  return await processNextAction();
}

