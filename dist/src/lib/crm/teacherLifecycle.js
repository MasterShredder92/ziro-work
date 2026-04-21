import { createTeacher, updateTeacher } from "@data/teachers";
const LEGAL_NEXT = {
    onboarding: ["active", "inactive"],
    active: ["inactive", "onboarding"],
    inactive: ["onboarding", "active"],
};
export function canTransition(from, to) {
    var _a, _b;
    return (_b = (_a = LEGAL_NEXT[from]) === null || _a === void 0 ? void 0 : _a.includes(to)) !== null && _b !== void 0 ? _b : false;
}
export async function onboardTeacher(tenantId, input) {
    const row = await createTeacher(tenantId, Object.assign(Object.assign({}, input), { status: "onboarding", is_active: true }));
    return row;
}
export async function setTeacherStage(tenantId, teacherId, stage) {
    const patch = {
        status: stage,
    };
    if (stage === "inactive") {
        patch.is_active = false;
        patch.termination_date = new Date().toISOString();
    }
    else {
        patch.is_active = true;
    }
    const row = await updateTeacher(teacherId, tenantId, patch);
    return row;
}
