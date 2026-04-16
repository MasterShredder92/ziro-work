import { registerTool } from "../tools";

registerTool({
  name: "send_onboarding_message",
  run: async ({ student_id, studentId, template_id }) => {
    const id = student_id ?? studentId ?? "unknown";
    // eslint-disable-next-line no-console
    console.log("Mock onboarding message:", id, template_id ? `(template: ${template_id})` : "");
    return { success: true };
  },
});
