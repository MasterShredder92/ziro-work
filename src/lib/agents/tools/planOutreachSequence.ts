import { registerTool } from "../tools";
import type { AgentContext } from "../types";
import { planOutreachSequence as plan } from "../../tools/planOutreachSequence";
import type { Lead } from "../../types/leads";

registerTool({
  name: "plan_outreach_sequence",
  run: async ({ lead }, ctx) => {
    return await plan(ctx as AgentContext, lead as Lead);
  },
});
