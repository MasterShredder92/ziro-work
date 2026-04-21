import { getStudentById, updateStudent, createStudent, deactivateStudent, } from "@data/students";
/**
 * Advance a student through the CRM lifecycle.
 * Legal transitions: lead → prospect → enrolled → inactive.
 * "inactive" can also be re-opened to any earlier stage.
 */
const LEGAL_NEXT = {
    lead: ["prospect", "enrolled", "inactive"],
    prospect: ["enrolled", "inactive", "lead"],
    enrolled: ["inactive", "prospect"],
    inactive: ["lead", "prospect", "enrolled"],
};
export function canTransition(from, to) {
    var _a, _b;
    return (_b = (_a = LEGAL_NEXT[from]) === null || _a === void 0 ? void 0 : _a.includes(to)) !== null && _b !== void 0 ? _b : false;
}
export async function setStudentStage(tenantId, studentId, nextStage, opts) {
    var _a, _b;
    const current = await getStudentById(studentId, tenantId);
    if (!current)
        throw new Error(`Student ${studentId} not found`);
    const currentStage = ((_a = current.status) !== null && _a !== void 0 ? _a : "lead");
    if (currentStage === nextStage)
        return current;
    if (!canTransition(currentStage, nextStage)) {
        throw new Error(`Illegal student transition ${currentStage} → ${nextStage}`);
    }
    if (nextStage === "inactive") {
        return deactivateStudent(studentId, tenantId, (_b = opts === null || opts === void 0 ? void 0 : opts.actorId) !== null && _b !== void 0 ? _b : "system", opts === null || opts === void 0 ? void 0 : opts.reason, opts === null || opts === void 0 ? void 0 : opts.category);
    }
    return updateStudent(studentId, tenantId, {
        status: nextStage,
        deactivated_at: null,
        deactivated_by: null,
    });
}
export async function createProspect(tenantId, input) {
    return createStudent(tenantId, Object.assign(Object.assign({}, input), { status: "prospect" }));
}
export async function enrollStudentAsActive(tenantId, studentId, firstLessonDate) {
    return updateStudent(studentId, tenantId, {
        status: "enrolled",
        first_lesson_date: firstLessonDate !== null && firstLessonDate !== void 0 ? firstLessonDate : null,
        start_date: firstLessonDate !== null && firstLessonDate !== void 0 ? firstLessonDate : null,
    });
}
