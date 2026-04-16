import { registerTool } from "../tools";
import type { AgentContext } from "../types";
import { computeLeadAging as compute } from "../../tools/computeLeadAging";
import type { Lead } from "../../types/leads";

registerTool({
  name: "compute_lead_aging",
  run: async ({ lead }, ctx) => {
    return await compute(ctx as AgentContext, lead as Lead);
  },
});
