import { registerTool } from "../tools";
import { planRetentionSequence as plan } from "../../tools/planRetentionSequence";
import type { Student } from "../../types/students";

registerTool({
  name: "plan_retention_sequence",
  run: async ({ student, missed_in_last_30_days }) => {
    return plan(student as Student, missed_in_last_30_days as number | undefined);
  },
});
