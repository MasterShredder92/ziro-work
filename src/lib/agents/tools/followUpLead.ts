import { registerTool } from "../tools";

registerTool({
  name: "follow_up_lead",
  run: async ({ lead, lead_id, template_id }) => {
    const label =
      lead?.name ??
      lead?.full_name ??
      lead?.email ??
      (lead_id ? `lead:${lead_id}` : "unknown lead");

    // eslint-disable-next-line no-console
    console.log("Mock follow-up sent to:", label, template_id ? `(template: ${template_id})` : "");
    return { success: true };
  },
});

