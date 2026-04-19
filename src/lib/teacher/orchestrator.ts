import { invokeSkill, type InvokeSkillResult } from "@/lib/ziro/invokeSkill";
import { getTeacherProfile } from "./queries";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

export type TeacherWorkflowStep =
  | "findAvailability"
  | "detectConflicts"
  | "scheduleFollowup"
  | "messageStudent";

export type TeacherWorkflowStepResult = {
  step: TeacherWorkflowStep;
  skillId: string;
  status: "ok" | "error";
  output?: InvokeSkillResult["output"];
  error?: { message: string; code?: string };
  durationMs: number;
  startedAt: string;
};

export type TeacherWorkflowResult = {
  teacherId: string;
  tenantId: string;
  startedAt: string;
  finishedAt: string;
  ok: boolean;
  steps: TeacherWorkflowStepResult[];
};

const WORKFLOW_STEPS: Array<{ step: TeacherWorkflowStep; skillId: string }> = [
  { step: "findAvailability", skillId: "ruby.findAvailability" },
  { step: "detectConflicts", skillId: "ruby.detectConflicts" },
  { step: "scheduleFollowup", skillId: "stewie.scheduleFollowup" },
  { step: "messageStudent", skillId: "vader.messageStudent" },
];

export async function runTeacherWorkflow(
  teacherId: string,
  opts?: { tenantId?: string; profileId?: string },
): Promise<TeacherWorkflowResult> {
  const startedAt = new Date().toISOString();

  let tenantId = opts?.tenantId?.trim() ?? "";
  if (!tenantId) {
    const teacher = await getTeacherProfile(teacherId);
    tenantId =
      (teacher?.tenant_id as string | undefined) ?? DEFAULT_TENANT_ID;
  }

  const profileId = opts?.profileId ?? teacherId;
  const conversationId = `teacher-workflow-${teacherId}-${Date.now()}`;

  const steps: TeacherWorkflowStepResult[] = [];
  let allOk = true;

  for (const { step, skillId } of WORKFLOW_STEPS) {
    const res = await invokeSkill(skillId, {
      tenantId,
      profileId,
      conversationId,
      extra: { teacherId, step },
    });

    if (res.ok) {
      steps.push({
        step,
        skillId,
        status: "ok",
        output: res.output,
        durationMs: res.durationMs,
        startedAt: res.startedAt,
      });
    } else {
      allOk = false;
      steps.push({
        step,
        skillId,
        status: "error",
        error: res.error ?? { message: "Skill invocation failed" },
        durationMs: res.durationMs,
        startedAt: res.startedAt,
      });
    }
  }

  return {
    teacherId,
    tenantId,
    startedAt,
    finishedAt: new Date().toISOString(),
    ok: allOk,
    steps,
  };
}
