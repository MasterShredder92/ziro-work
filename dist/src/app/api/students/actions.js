"use server";
import { revalidatePath } from "next/cache";
import { createStudent, deactivateStudent, getStudentById, listStudents, updateStudent, } from "@data/students";
import { assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
export async function listStudentsAction(tenantId, filter) {
    await assertTenantAccess(tenantId);
    return listStudents(tenantId, filter);
}
export async function getStudentAction(tenantId, id) {
    await assertTenantAccess(tenantId);
    return getStudentById(id, tenantId);
}
export async function createStudentAction(tenantId, input) {
    await assertTenantAccess(tenantId);
    await logAudit("students.create", { tenantId, input });
    const row = await createStudent(tenantId, input);
    revalidatePath("/students");
    return row;
}
export async function updateStudentAction(tenantId, id, input) {
    await assertTenantAccess(tenantId);
    await logAudit("students.update", { tenantId, id, input });
    const row = await updateStudent(id, tenantId, input);
    revalidatePath("/students");
    revalidatePath(`/students/${id}`);
    return row;
}
export async function deactivateStudentAction(tenantId, id, deactivatedBy, reason, category) {
    await assertTenantAccess(tenantId);
    await logAudit("students.deactivate", {
        tenantId,
        id,
        deactivatedBy,
        reason,
        category,
    });
    const row = await deactivateStudent(id, tenantId, deactivatedBy, reason, category);
    revalidatePath("/students");
    revalidatePath(`/students/${id}`);
    return row;
}
