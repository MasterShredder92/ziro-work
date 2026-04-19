import { processNextUnified } from "./agentUnifiedProcessor";

export async function runOne(): Promise<
  { type: "task" | "action"; agentId: string } | null
> {
  return await processNextUnified();
}

