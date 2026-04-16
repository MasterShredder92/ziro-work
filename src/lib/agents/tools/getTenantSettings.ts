import { registerTool } from "../tools";
import type { AgentContext } from "../types";
import { getTenantSettings as load } from "../../tools/getTenantSettings";

registerTool({
  name: "get_tenant_settings",
  run: async (_args, ctx) => {
    return await load(ctx as AgentContext);
  },
});
