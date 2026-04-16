import { registerTool } from "../tools";

registerTool({
  name: "score_lead",
  run: async ({ lead }) => {
    const name = String(lead?.name ?? lead?.full_name ?? lead?.email ?? "");
    const status = String(lead?.status ?? "");
    const score = (name.length % 10) * 10 + (status === "new" ? 20 : 0);
    return { ...lead, score };
  },
});

