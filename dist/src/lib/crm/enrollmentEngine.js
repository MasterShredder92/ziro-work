/**
 * Enrollment engine — orchestrates enrolling a student with a teacher,
 * updating their schedule linkage, and propagating status changes.
 *
 * Integrates with:
 *  - Scheduling OS (teacher assignment on `students.teacher_id`)
 *  - Billing OS (via `families` on the student's family_id; we do not
 *    mutate billing rows directly from here)
 *  - CRM student lifecycle (promotes to "enrolled")
 */
import { createEnrollment, endEnrollment as endEnrollmentRow, getEnrollmentById, listEnrollments, updateEnrollment as updateEnrollmentRow, } from "@data/enrollments";
import { getStudentById, updateStudent } from "@data/students";
export async function enrollStudent(tenantId, input) {
    var _a, _b, _c, _d, _e;
    const student = await getStudentById(input.studentId, tenantId);
    if (!student)
        throw new Error(`Student ${input.studentId} not found`);
    const enrollment = await createEnrollment(tenantId, {
        student_id: input.studentId,
        teacher_id: input.teacherId,
        start_date: (_a = input.startDate) !== null && _a !== void 0 ? _a : new Date().toISOString().slice(0, 10),
        status: (_b = input.status) !== null && _b !== void 0 ? _b : "active",
    });
    await updateStudent(input.studentId, tenantId, {
        teacher_id: input.teacherId,
        status: "enrolled",
        start_date: (_c = input.startDate) !== null && _c !== void 0 ? _c : null,
        first_lesson_date: (_e = (_d = student.first_lesson_date) !== null && _d !== void 0 ? _d : input.startDate) !== null && _e !== void 0 ? _e : null,
    });
    return enrollment;
}
export async function updateEnrollment(tenantId, id, patch) {
    return updateEnrollmentRow(id, tenantId, patch);
}
export async function endEnrollment(tenantId, id, endDate) {
    const effective = endDate !== null && endDate !== void 0 ? endDate : new Date().toISOString().slice(0, 10);
    const ended = await endEnrollmentRow(id, tenantId, effective);
    const active = await listEnrollments(tenantId, {
        student_id: ended.student_id,
        status: "active",
    });
    if (active.length === 0) {
        await updateStudent(ended.student_id, tenantId, {
            status: "inactive",
            end_date: effective,
        });
    }
    return ended;
}
export async function listEnrollmentsFor(tenantId, filter) {
    return listEnrollments(tenantId, filter);
}
export async function getEnrollment(tenantId, id) {
    return getEnrollmentById(id, tenantId);
}
