import { registerTool } from "../tools";
import type { AgentContext } from "../types";
import { computeTrialAging as compute } from "../../tools/computeTrialAging";
import type { Trial } from "../../types/trials";

registerTool({
  name: "compute_trial_aging",
  run: async ({ trial }, ctx) => {
    return await compute(ctx as AgentContext, trial as Trial);
  },
});
