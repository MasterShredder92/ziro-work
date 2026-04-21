"use server";
import { revalidatePath } from "next/cache";
import { createSessionLog, deleteSessionLog, getSessionLogById, getSessionLogByBlockId, listSessionLog, updateSessionLog, } from "@data/sessionLog";
import { assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
export async function listSessionLogAction(tenantId, filter) {
    await assertTenantAccess(tenantId);
    return listSessionLog(tenantId, filter);
}
export async function getSessionLogAction(tenantId, id) {
    await assertTenantAccess(tenantId);
    return getSessionLogById(id, tenantId);
}
export async function getSessionLogByBlockAction(tenantId, blockId) {
    await assertTenantAccess(tenantId);
    return getSessionLogByBlockId(blockId, tenantId);
}
export async function createSessionLogAction(tenantId, input) {
    await assertTenantAccess(tenantId);
    await logAudit("session_log.create", { tenantId, input });
    const row = await createSessionLog(tenantId, input);
    revalidatePath("/scheduling");
    revalidatePath(`/students/${input.student_id}`);
    return row;
}
export async function updateSessionLogAction(tenantId, id, input) {
    await assertTenantAccess(tenantId);
    await logAudit("session_log.update", { tenantId, id, input });
    const row = await updateSessionLog(id, tenantId, input);
    revalidatePath("/scheduling");
    return row;
}
export async function deleteSessionLogAction(tenantId, id) {
    await assertTenantAccess(tenantId);
    await logAudit("session_log.delete", { tenantId, id });
    await deleteSessionLog(id, tenantId);
    revalidatePath("/scheduling");
}
