import { addStudentToFamily as addStudent, removeStudentFromFamily as removeStudent, setPrimaryGuardian as setPrimary, } from "@data/relationships";
export async function addStudentToFamily(tenantId, studentId, familyId) {
    return addStudent(tenantId, studentId, familyId);
}
export async function removeStudentFromFamily(tenantId, studentId) {
    return removeStudent(tenantId, studentId);
}
export async function setPrimaryGuardian(tenantId, familyId, input) {
    return setPrimary(tenantId, familyId, input);
}
