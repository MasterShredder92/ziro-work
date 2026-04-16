import { registerTool } from "../tools";
import { planOnboardingSequence as plan } from "../../tools/planOnboardingSequence";
import type { Student } from "../../types/students";

registerTool({
  name: "plan_onboarding_sequence",
  run: async ({ student }) => {
    return plan(student as Student);
  },
});
