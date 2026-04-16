import { registerTool } from "../tools";
import type { AgentContext } from "../types";
import { createEnrollment as create } from "../../tools/createEnrollment";

registerTool({
  name: "create_enrollment",
  run: async ({ lead_id }, ctx) => {
    return await create(ctx as AgentContext, { lead_id });
  },
});
