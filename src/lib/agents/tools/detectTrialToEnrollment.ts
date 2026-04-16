import { registerTool } from "../tools";
import type { AgentContext } from "../types";
import { detectTrialToEnrollment as detect } from "../../tools/detectTrialToEnrollment";

registerTool({
  name: "detect_trial_to_enrollment",
  run: async (_args, ctx) => {
    return await detect(ctx as AgentContext);
  },
});
