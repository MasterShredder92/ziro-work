import { registerTool } from "../tools";
import type { AgentContext } from "../types";

type ToolsBundle = {
  get_students: (p: { tenantId: string }) => Promise<unknown[] | null | undefined>;
  get_leads: (p: { tenantId: string }) => Promise<unknown[] | null | undefined>;
  get_trials: (p: { tenantId: string }) => Promise<unknown[] | null | undefined>;
};

registerTool({
  name: "get_kpis",
  run: async (args: unknown, ctx: AgentContext) => {
    const { tenantId } = args as { tenantId: string };
    const tools = (ctx as AgentContext & { tools: ToolsBundle }).tools;
    const [students, leads, trials] = await Promise.all([
      tools.get_students({ tenantId }),
      tools.get_leads({ tenantId }),
      tools.get_trials({ tenantId }),
    ]);

    const weekAgo = Date.now() - 7 * 86400000;
    const leadsThisWeek = (leads ?? []).filter((l: unknown) => {
      if (!l || typeof l !== "object") return false;
      const createdRaw = (l as Record<string, unknown>).created_at;
      const createdAt = createdRaw ? +new Date(String(createdRaw)) : 0;
      return createdAt >= weekAgo;
    }).length;

    return {
      activeStudents: (students ?? []).length,
      leadsThisWeek,
      trialsScheduled: (trials ?? []).length,
      churnRisk: (students ?? []).length > 0 ? 0.1 : 0,
    };
  },
});

