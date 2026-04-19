import "server-only";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import {
  invokeSkill,
  type InvokeSkillContext,
  type InvokeSkillResult,
} from "@/lib/ziro/invokeSkill";
import { getLeadById } from "./queries";

export type LeadWorkflowStep =
  | "qualifyLead"
  | "findLeadDuplicates"
  | "scheduleFollowup"
  | "promoteLead";

export type LeadWorkflowStepStatus = "ok" | "error" | "skipped";

export interface LeadWorkflowStepResult {
  step: LeadWorkflowStep;
  skillId: string;
  status: LeadWorkflowStepStatus;
  result?: InvokeSkillResult;
  reason?: string;
}

export interface LeadWorkflowResult {
  leadId: string;
  tenantId: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  ok: boolean;
  steps: LeadWorkflowStepResult[];
  order: LeadWorkflowStep[];
  promoted: boolean;
  qualificationTier: string | null;
}

export interface RunLeadWorkflowOptions {
  tenantId?: string;
  profileId?: string;
  conversationId?: string;
}

const STEPS: Array<{ step: LeadWorkflowStep; skillId: string }> = [
  { step: "qualifyLead", skillId: "star.qualifyLead" },
  { step: "findLeadDuplicates", skillId: "star.findLeadDuplicates" },
  { step: "scheduleFollowup", skillId: "stewie.scheduleFollowup" },
  { step: "promoteLead", skillId: "star.promoteLead" },
];

function extractTier(result: InvokeSkillResult | undefined): string | null {
  const payload = result?.output?.result as
    | { tier?: string; score?: number }
    | undefined;
  return payload?.tier ?? null;
}

function shouldPromote(tier: string | null): boolean {
  return tier === "hot";
}

function buildInput(leadId: string, step: LeadWorkflowStep): string {
  return `lead=${leadId} step=${step}`;
}

export async function runLeadWorkflow(
  leadId: string,
  options: RunLeadWorkflowOptions = {},
): Promise<LeadWorkflowResult> {
  const startedAtDate = new Date();
  const startedAt = startedAtDate.toISOString();
  const t0 = Date.now();

  let tenantId = options.tenantId?.trim() ?? "";
  if (!tenantId) {
    const lead = await getLeadById(leadId, DEFAULT_TENANT_ID);
    tenantId = (lead?.tenant_id as string | undefined) ?? DEFAULT_TENANT_ID;
  }

  const conversationId =
    options.conversationId ?? `lead-workflow-${leadId}-${startedAtDate.getTime()}`;

  const ctx: InvokeSkillContext = {
    tenantId,
    profileId: options.profileId,
    conversationId,
    extra: { leadId },
  };

  const steps: LeadWorkflowStepResult[] = [];
  let allOk = true;
  let qualificationTier: string | null = null;
  let promoted = false;

  for (const { step, skillId } of STEPS) {
    if (step === "promoteLead" && !shouldPromote(qualificationTier)) {
      steps.push({
        step,
        skillId,
        status: "skipped",
        reason: `Lead tier is ${qualificationTier ?? "unknown"}; promotion not warranted.`,
      });
      continue;
    }

    const result = await invokeSkill(skillId, {
      ...ctx,
      input: buildInput(leadId, step),
    });

    if (step === "qualifyLead") {
      qualificationTier = extractTier(result);
    }

    if (!result.ok) {
      allOk = false;
      steps.push({
        step,
        skillId,
        status: "error",
        result,
        reason: result.error?.message,
      });
      continue;
    }

    if (step === "promoteLead") {
      promoted = true;
    }

    steps.push({
      step,
      skillId,
      status: "ok",
      result,
    });
  }

  const finishedAtDate = new Date();
  return {
    leadId,
    tenantId,
    startedAt,
    finishedAt: finishedAtDate.toISOString(),
    durationMs: Date.now() - t0,
    ok: allOk,
    steps,
    order: STEPS.map((s) => s.step),
    promoted,
    qualificationTier,
  };
}
