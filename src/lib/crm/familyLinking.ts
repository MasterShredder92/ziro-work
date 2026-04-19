import {
  addStudentToFamily as addStudent,
  removeStudentFromFamily as removeStudent,
  setPrimaryGuardian as setPrimary,
} from "@data/relationships";

export async function addStudentToFamily(
  tenantId: string,
  studentId: string,
  familyId: string,
): Promise<void> {
  return addStudent(tenantId, studentId, familyId);
}

export async function removeStudentFromFamily(
  tenantId: string,
  studentId: string,
): Promise<void> {
  return removeStudent(tenantId, studentId);
}

export async function setPrimaryGuardian(
  tenantId: string,
  familyId: string,
  input: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    relationship?: string | null;
  },
): Promise<void> {
  return setPrimary(tenantId, familyId, input);
}
