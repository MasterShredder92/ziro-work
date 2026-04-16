import { registerTool } from "../tools";

registerTool({
  name: "get_kpis",
  run: async ({ tenantId }, ctx) => {
    const [students, leads, trials] = await Promise.all([
      ctx.tools.get_students({ tenantId }),
      ctx.tools.get_leads({ tenantId }),
      ctx.tools.get_trials({ tenantId }),
    ]);

    const weekAgo = Date.now() - 7 * 86400000;
    const leadsThisWeek = (leads ?? []).filter((l: any) => {
      const createdAt = l.created_at ? +new Date(l.created_at) : 0;
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

