import { registerTool } from "../tools";

registerTool({
  name: "follow_up_lead",
  run: async (args: unknown) => {
    const { lead, lead_id, template_id } = args as {
      lead?: { name?: string; full_name?: string; email?: string };
      lead_id?: string;
      template_id?: string;
    };
    const label =
      lead?.name ??
      lead?.full_name ??
      lead?.email ??
      (lead_id ? `lead:${lead_id}` : "unknown lead");

    console.log("Mock follow-up sent to:", label, template_id ? `(template: ${template_id})` : "");
    return { success: true };
  },
});

