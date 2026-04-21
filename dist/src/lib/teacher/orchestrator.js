import { invokeSkill } from "@/lib/ziro/invokeSkill";
import { getTeacherProfile } from "./queries";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
const WORKFLOW_STEPS = [
    { step: "findAvailability", skillId: "ruby.findAvailability" },
    { step: "detectConflicts", skillId: "ruby.detectConflicts" },
    { step: "scheduleFollowup", skillId: "stewie.scheduleFollowup" },
    { step: "messageStudent", skillId: "vader.messageStudent" },
];
export async function runTeacherWorkflow(teacherId, opts) {
    var _a, _b, _c, _d, _e;
    const startedAt = new Date().toISOString();
    let tenantId = (_b = (_a = opts === null || opts === void 0 ? void 0 : opts.tenantId) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : "";
    if (!tenantId) {
        const teacher = await getTeacherProfile(teacherId);
        tenantId =
            (_c = teacher === null || teacher === void 0 ? void 0 : teacher.tenant_id) !== null && _c !== void 0 ? _c : DEFAULT_TENANT_ID;
    }
    const profileId = (_d = opts === null || opts === void 0 ? void 0 : opts.profileId) !== null && _d !== void 0 ? _d : teacherId;
    const conversationId = `teacher-workflow-${teacherId}-${Date.now()}`;
    const steps = [];
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
        }
        else {
            allOk = false;
            steps.push({
                step,
                skillId,
                status: "error",
                error: (_e = res.error) !== null && _e !== void 0 ? _e : { message: "Skill invocation failed" },
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
