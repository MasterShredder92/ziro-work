import { registerTool } from "../tools";

registerTool({
  name: "send_onboarding_message",
  run: async (args: unknown) => {
    const { student_id, studentId, template_id } = args as {
      student_id?: string;
      studentId?: string;
      template_id?: string;
    };
    const id = student_id ?? studentId ?? "unknown";
    console.log("Mock onboarding message:", id, template_id ? `(template: ${template_id})` : "");
    return { success: true };
  },
});
