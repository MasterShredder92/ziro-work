import "server-only";
import {
  getFamilyInvoices,
  getFamilyMessages,
  getFamilyProfile,
  getFamilySchedule,
  getFamilyStudents,
  getStudentInvoices,
  getStudentLessons,
  getStudentMessages,
  getStudentProfile,
  getStudentSchedule,
} from "./queries";
import type { FamilyPortalData, StudentPortalData } from "./types";

export async function getStudentPortal(
  studentId: string,
): Promise<StudentPortalData> {
  const [student, schedule, lessons, messages, invoices] = await Promise.all([
    getStudentProfile(studentId),
    getStudentSchedule(studentId),
    getStudentLessons(studentId),
    getStudentMessages(studentId),
    getStudentInvoices(studentId),
  ]);

  if (!student) {
    throw new Error(`Student ${studentId} not found`);
  }

  return { student, schedule, lessons, messages, invoices };
}

export async function getFamilyPortal(
  familyId: string,
): Promise<FamilyPortalData> {
  const [family, students, schedule, invoices, messages] = await Promise.all([
    getFamilyProfile(familyId),
    getFamilyStudents(familyId),
    getFamilySchedule(familyId),
    getFamilyInvoices(familyId),
    getFamilyMessages(familyId),
  ]);

  if (!family) {
    throw new Error(`Family ${familyId} not found`);
  }

  return { family, students, schedule, invoices, messages };
}
