import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { invokeSkill } from "@/lib/ziro/invokeSkill";
export const DIRECTOR_WORKFLOW_STEPS = [
    "kpiSnapshot",
    "teacherLoadReport",
    "invoiceAgingReport",
    "hotLeads",
];
export async function runDirectorWorkflow(locationId, options = {}) {
    var _a, _b;
    const tenantId = (_a = options.tenantId) !== null && _a !== void 0 ? _a : DEFAULT_TENANT_ID;
    const startedAt = new Date();
    const startedAtIso = startedAt.toISOString();
    const conversationId = (_b = options.conversationId) !== null && _b !== void 0 ? _b : `director-workflow-${startedAt.getTime()}`;
    const steps = {};
    let allOk = true;
    for (const step of DIRECTOR_WORKFLOW_STEPS) {
        const result = await invokeSkill(step, {
            tenantId,
            profileId: options.profileId,
            conversationId,
            locationId,
        });
        steps[step] = result;
        if (!result.ok)
            allOk = false;
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
