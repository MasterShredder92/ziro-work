import "server-only";
import {
  invokeSkill,
  type InvokeSkillInput,
  type InvokeSkillResult,
} from "./skillInvoker";

export type WorkflowStep = {
  agentId?: string | null;
  skillId: string;
  input?: string | null;
  tenantId?: string | null;
  profileId?: string | null;
  conversationId?: string | null;
};

export type WorkflowStepResult = {
  step: WorkflowStep;
  result: InvokeSkillResult;
};

export type WorkflowResult = {
  ok: boolean;
  results: WorkflowStepResult[];
  failures: WorkflowStepResult[];
};

export type RunWorkflowOptions = {
  stopOnFailure?: boolean;
  tenantId?: string | null;
  profileId?: string | null;
  conversationId?: string | null;
};

function mergeInput(
  step: WorkflowStep,
  opts: RunWorkflowOptions,
): InvokeSkillInput {
  return {
    input: step.input ?? "",
    tenantId: step.tenantId ?? opts.tenantId ?? null,
    profileId: step.profileId ?? opts.profileId ?? null,
    conversationId: step.conversationId ?? opts.conversationId ?? null,
    agent: step.agentId ?? null,
  };
}

export async function runWorkflow(
  steps: WorkflowStep[],
  opts: RunWorkflowOptions = {},
): Promise<WorkflowResult> {
  const results: WorkflowStepResult[] = [];
  const failures: WorkflowStepResult[] = [];
  if (!Array.isArray(steps) || steps.length === 0) {
    return { ok: true, results, failures };
  }

  for (const step of steps) {
    if (!step || typeof step.skillId !== "string" || step.skillId.length === 0) {
      const bad: WorkflowStepResult = {
        step: step ?? ({} as WorkflowStep),
        result: { ok: false, source: null, error: "STEP_SKILL_ID_REQUIRED" },
      };
      results.push(bad);
      failures.push(bad);
      if (opts.stopOnFailure) break;
      continue;
    }
    const args = mergeInput(step, opts);
    const result = await invokeSkill(step.skillId, args);
    const entry: WorkflowStepResult = { step, result };
    results.push(entry);
    if (!result.ok) {
      failures.push(entry);
      if (opts.stopOnFailure) break;
    }
  }

  return {
    ok: failures.length === 0,
    results,
    failures,
  };
}

export async function runWorkflowParallel(
  steps: WorkflowStep[],
  opts: RunWorkflowOptions = {},
): Promise<WorkflowResult> {
  const results: WorkflowStepResult[] = [];
  const failures: WorkflowStepResult[] = [];
  if (!Array.isArray(steps) || steps.length === 0) {
    return { ok: true, results, failures };
  }
  const settled = await Promise.all(
    steps.map(async (step) => {
      if (!step || typeof step.skillId !== "string" || step.skillId.length === 0) {
        return {
          step: step ?? ({} as WorkflowStep),
          result: {
            ok: false,
            source: null,
            error: "STEP_SKILL_ID_REQUIRED",
          } as InvokeSkillResult,
        };
      }
      const args = mergeInput(step, opts);
      const result = await invokeSkill(step.skillId, args);
      return { step, result };
    }),
  );
  for (const entry of settled) {
    results.push(entry);
    if (!entry.result.ok) failures.push(entry);
  }
  return {
    ok: failures.length === 0,
    results,
    failures,
  };
}
