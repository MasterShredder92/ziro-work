import { registerTool } from "../tools";
import type { AgentContext } from "../types";
import { computeTenantKPIs as compute } from "../../tools/computeTenantKPIs";

registerTool({
  name: "compute_tenant_kpis",
  run: async (_args, ctx) => {
    return await compute(ctx as AgentContext);
  },
});
