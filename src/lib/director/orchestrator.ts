import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { invokeSkill, type InvokeSkillResult } from "@/lib/ziro/invokeSkill";

export type DirectorWorkflowStep =
  | "kpiSnapshot"
  | "teacherLoadReport"
  | "invoiceAgingReport"
  | "hotLeads";

export const DIRECTOR_WORKFLOW_STEPS: DirectorWorkflowStep[] = [
  "kpiSnapshot",
  "teacherLoadReport",
  "invoiceAgingReport",
  "hotLeads",
];

export type DirectorWorkflowResult = {
  locationId: string;
  tenantId: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  ok: boolean;
  steps: Record<DirectorWorkflowStep, InvokeSkillResult>;
  order: DirectorWorkflowStep[];
};

export type RunDirectorWorkflowOptions = {
  tenantId?: string;
  profileId?: string;
  conversationId?: string;
};

export async function runDirectorWorkflow(
  locationId: string,
  options: RunDirectorWorkflowOptions = {},
): Promise<DirectorWorkflowResult> {
  const tenantId = options.tenantId ?? DEFAULT_TENANT_ID;
  const startedAt = new Date();
  const startedAtIso = startedAt.toISOString();
  const conversationId =
    options.conversationId ?? `director-workflow-${startedAt.getTime()}`;

  const steps = {} as Record<DirectorWorkflowStep, InvokeSkillResult>;
  let allOk = true;

  for (const step of DIRECTOR_WORKFLOW_STEPS) {
    const result = await invokeSkill(step, {
      tenantId,
      profileId: options.profileId,
      conversationId,
      locationId,
    });
    steps[step] = result;
    if (!result.ok) allOk = false;
  }

  const finishedAt = new Date();

  return {
    locationId,
    tenantId,
    startedAt: startedAtIso,
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    ok: allOk,
    steps,
    order: [...DIRECTOR_WORKFLOW_STEPS],
  };
}
