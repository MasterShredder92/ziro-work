import { registerTool } from "../tools";

registerTool({
  name: "send_trial_reminder",
  run: async ({ trial, trial_id, template_id }) => {
    const id = trial?.id ?? trial_id ?? "unknown";
    // eslint-disable-next-line no-console
    console.log("Mock trial reminder:", id, template_id ? `(template: ${template_id})` : "");
    return { success: true };
  },
});

