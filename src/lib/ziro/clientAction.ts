import { runZiroTurn, type RunZiroTurnArgs, type RunZiroTurnResult } from "@/actions/ziro";

export async function ziroTurn(args: RunZiroTurnArgs): Promise<RunZiroTurnResult> {
  return runZiroTurn(args);
}

export type { RunZiroTurnArgs, RunZiroTurnResult };
