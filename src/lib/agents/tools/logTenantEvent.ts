import { registerTool } from "../tools";
import type { AgentContext } from "../types";
import { logTenantEvent as log } from "../../tools/logTenantEvent";

registerTool({
  name: "log_tenant_event",
  run: async ({ event }, ctx) => {
    return await log(ctx as AgentContext, event);
  },
});
