"use server";
/**
 * runTurn — STUB
 * Agent turn execution removed. Re-initialize when agent layer is rebuilt.
 */

export type RunZiroTurnArgs = {
  message: string;
  agentId?: string;
  history?: Array<{ role: string; content: string }>;
};

export type RunZiroTurnResult = {
  reply: string;
  error?: string;
};

export async function runZiroTurn(_args: RunZiroTurnArgs): Promise<RunZiroTurnResult> {
  return {
    reply: "Agent system offline. Platform is in CRM-only mode.",
  };
}
