import { runTurn, type RunTurnInput, type TurnResult } from "./conversationPipeline";

export const ziro = {
  run: (args: RunTurnInput): Promise<TurnResult> => runTurn(args),
};

export type ZiroRuntimeClient = typeof ziro;
