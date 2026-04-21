"use server";
import { revalidatePath } from "next/cache";
import { completeTask, createTask, deleteTask, getTaskById, listTasks, snoozeTask, updateTask, } from "@data/tasks";
import { assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
export async function listTasksAction(tenantId, filter) {
    await assertTenantAccess(tenantId);
    return listTasks(tenantId, filter);
}
export async function getTaskAction(tenantId, id) {
    await assertTenantAccess(tenantId);
    return getTaskById(id, tenantId);
}
export async function createTaskAction(tenantId, input) {
    await assertTenantAccess(tenantId);
    await logAudit("tasks.create", { tenantId, input });
    const row = await createTask(tenantId, input);
    revalidatePath("/tasks");
    return row;
}
export async function updateTaskAction(tenantId, id, input) {
    await assertTenantAccess(tenantId);
    await logAudit("tasks.update", { tenantId, id, input });
    const row = await updateTask(id, tenantId, input);
    revalidatePath("/tasks");
    return row;
}
export async function completeTaskAction(tenantId, id, completedBy, completionNote) {
    await assertTenantAccess(tenantId);
    await logAudit("tasks.complete", {
        tenantId,
        id,
        completedBy,
        completionNote,
    });
    const row = await completeTask(id, tenantId, completedBy, completionNote);
    revalidatePath("/tasks");
    return row;
}
export async function snoozeTaskAction(tenantId, id, until) {
    await assertTenantAccess(tenantId);
    await logAudit("tasks.snooze", { tenantId, id, until });
    const row = await snoozeTask(id, tenantId, until);
    revalidatePath("/tasks");
    return row;
}
export async function deleteTaskAction(tenantId, id) {
    await assertTenantAccess(tenantId);
    await logAudit("tasks.delete", { tenantId, id });
    await deleteTask(id, tenantId);
    revalidatePath("/tasks");
}
