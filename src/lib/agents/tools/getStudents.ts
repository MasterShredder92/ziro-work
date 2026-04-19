import { registerTool } from "../tools";
import type { AgentContext } from "../types";
import { getStudentById, getStudentsForTenant } from "../../../../lib/data/students";

registerTool({
  name: "get_students",
  run: async (args: unknown, ctx: AgentContext) => {
    void ctx;
    const { tenantId, filter } = args as { tenantId: string; filter?: { id?: string } };
    if (filter?.id) {
      const row = await getStudentById(String(filter.id), String(tenantId));
      return row ? [row] : [];
    }

    return await getStudentsForTenant(String(tenantId));
  },
});

