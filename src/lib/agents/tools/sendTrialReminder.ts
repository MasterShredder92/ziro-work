import { registerTool } from "../tools";

registerTool({
  name: "send_trial_reminder",
  run: async (args: unknown) => {
    const { trial, trial_id, template_id } = args as {
      trial?: { id?: string };
      trial_id?: string;
      template_id?: string;
    };
    const id = trial?.id ?? trial_id ?? "unknown";
    console.log("Mock trial reminder:", id, template_id ? `(template: ${template_id})` : "");
    return { success: true };
  },
});

