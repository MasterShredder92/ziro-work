import { registerTool } from "../tools";
import type { AgentContext } from "../types";
import { planTrialSequence as plan } from "../../tools/planTrialSequence";
import type { Trial } from "../../types/trials";

registerTool({
  name: "plan_trial_sequence",
  run: async ({ trial }, ctx) => {
    return await plan(ctx as AgentContext, trial as Trial);
  },
});
