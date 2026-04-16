import { registerTool } from "../tools";
import type { AgentContext } from "../types";
import { detectAtRiskStudents as detect } from "../../tools/detectAtRiskStudents";

registerTool({
  name: "detect_at_risk_students",
  run: async (_args, ctx) => {
    return await detect(ctx as AgentContext);
  },
});
