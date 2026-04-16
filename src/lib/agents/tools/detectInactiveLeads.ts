import { registerTool } from "../tools";
import type { AgentContext } from "../types";
import { detectInactiveLeads as detect } from "../../tools/detectInactiveLeads";

registerTool({
  name: "detect_inactive_leads",
  run: async (_args, ctx) => {
    return await detect(ctx as AgentContext);
  },
});
