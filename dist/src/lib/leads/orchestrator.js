import "server-only";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { invokeSkill, } from "@/lib/ziro/invokeSkill";
import { getLeadById } from "./queries";
const STEPS = [
    { step: "qualifyLead", skillId: "star.qualifyLead" },
    { step: "findLeadDuplicates", skillId: "star.findLeadDuplicates" },
    { step: "scheduleFollowup", skillId: "stewie.scheduleFollowup" },
    { step: "promoteLead", skillId: "star.promoteLead" },
];
function extractTier(result) {
    var _a, _b;
    const payload = (_a = result === null || result === void 0 ? void 0 : result.output) === null || _a === void 0 ? void 0 : _a.result;
    return (_b = payload === null || payload === void 0 ? void 0 : payload.tier) !== null && _b !== void 0 ? _b : null;
}
function shouldPromote(tier) {
    return tier === "hot";
}
function buildInput(leadId, step) {
    return `lead=${leadId} step=${step}`;
}
export async function runLeadWorkflow(leadId, options = {}) {
    var _a, _b, _c, _d, _e;
    const startedAtDate = new Date();
    const startedAt = startedAtDate.toISOString();
    const t0 = Date.now();
    let tenantId = (_b = (_a = options.tenantId) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : "";
    if (!tenantId) {
        const lead = await getLeadById(leadId, DEFAULT_TENANT_ID);
        tenantId = (_c = lead === null || lead === void 0 ? void 0 : lead.tenant_id) !== null && _c !== void 0 ? _c : DEFAULT_TENANT_ID;
    }
    const conversationId = (_d = options.conversationId) !== null && _d !== void 0 ? _d : `lead-workflow-${leadId}-${startedAtDate.getTime()}`;
    const ctx = {
        tenantId,
        profileId: options.profileId,
        conversationId,
        extra: { leadId },
    };
    const steps = [];
    let allOk = true;
    let qualificationTier = null;
    let promoted = false;
    for (const { step, skillId } of STEPS) {
        if (step === "promoteLead" && !shouldPromote(qualificationTier)) {
            steps.push({
                step,
                skillId,
                status: "skipped",
                reason: `Lead tier is ${qualificationTier !== null && qualificationTier !== void 0 ? qualificationTier : "unknown"}; promotion not warranted.`,
            });
            continue;
        }
        const result = await invokeSkill(skillId, Object.assign(Object.assign({}, ctx), { input: buildInput(leadId, step) }));
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
                reason: (_e = result.error) === null || _e === void 0 ? void 0 : _e.message,
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
