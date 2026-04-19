import type { DbClient, FacadeResult } from "./core";
import { toErrorInfo } from "./core";
import type { Family, Invoice, Student, StudentLifecycleEntry, Teacher } from "./models";
import { getFamilyById } from "./families";
import { getStudentById, listStudents } from "./students";
import { getTeacherById } from "./teachers";
import { listInvoices } from "./invoices";
import { listStudentLifecycle } from "./studentLifecycle";

export interface FamilyWithStudents {
  family: Family;
  students: Student[];
}

export interface StudentLinked {
  student: Student;
  family: Family | null;
  teacher: Teacher | null;
  invoices: Invoice[];
  lifecycle: StudentLifecycleEntry[];
}

export async function getFamilyWithStudents(
  client: DbClient,
  tenantId: string,
  familyId: string
): Promise<FacadeResult<FamilyWithStudents | null>> {
  try {
    const fam = await getFamilyById(client, tenantId, familyId);
    if (fam.error) return { data: null, error: fam.error };
    if (!fam.data) return { data: null, error: null };

    const studentsRes = await listStudents(client, {
      tenantId,
      page: { mode: "cursor", limit: 500 },
      familyId,
    });
    if (studentsRes.error) return { data: null, error: studentsRes.error };

    return {
      data: { family: fam.data, students: studentsRes.data.items },
      error: null,
    };
  } catch (err) {
    return { data: null, error: toErrorInfo(err) };
  }
}

export async function getStudentLinked(
  client: DbClient,
  tenantId: string,
  studentId: string
): Promise<FacadeResult<StudentLinked | null>> {
  try {
    const stu = await getStudentById(client, tenantId, studentId);
    if (stu.error) return { data: null, error: stu.error };
    if (!stu.data) return { data: null, error: null };

    const familyPromise = stu.data.family_id
      ? getFamilyById(client, tenantId, stu.data.family_id)
      : Promise.resolve({ data: null, error: null } as FacadeResult<Family | null>);
    const teacherPromise = stu.data.teacher_id
      ? getTeacherById(client, tenantId, stu.data.teacher_id)
      : Promise.resolve({ data: null, error: null } as FacadeResult<Teacher | null>);

    const invoicesPromise = listInvoices(client, {
      tenantId,
      page: { mode: "cursor", limit: 500 },
      filters: { studentId },
    });
    const lifecyclePromise = listStudentLifecycle(client, {
      tenantId,
      studentId,
      page: { mode: "cursor", limit: 500 },
    });

    const [family, teacher, invoices, lifecycle] = await Promise.all([
      familyPromise,
      teacherPromise,
      invoicesPromise,
      lifecyclePromise,
    ]);

    if (family.error) return { data: null, error: family.error };
    if (teacher.error) return { data: null, error: teacher.error };
    if (invoices.error) return { data: null, error: invoices.error };
    if (lifecycle.error) return { data: null, error: lifecycle.error };

    return {
      data: {
        student: stu.data,
        family: family.data,
        teacher: teacher.data,
        invoices: invoices.data.items,
        lifecycle: lifecycle.data.items,
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: toErrorInfo(err) };
  }
}

