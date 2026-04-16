import { registerTool } from "../tools";
import type { AgentContext } from "../types";
import { detectInactiveTrials as detect } from "../../tools/detectInactiveTrials";

registerTool({
  name: "detect_inactive_trials",
  run: async (_args, ctx) => {
    return await detect(ctx as AgentContext);
  },
});
