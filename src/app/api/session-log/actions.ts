"use server";

import { revalidatePath } from "next/cache";
import {
  createSessionLog,
  deleteSessionLog,
  getSessionLogById,
  getSessionLogByBlockId,
  listSessionLog,
  updateSessionLog,
  type SessionLogFilter,
} from "@data/sessionLog";
import type { SessionLogInsert, SessionLogUpdate } from "@/lib/types/entities";
import { assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";

export async function listSessionLogAction(
  tenantId: string,
  filter?: SessionLogFilter,
) {
  await assertTenantAccess(tenantId);
  return listSessionLog(tenantId, filter);
}

export async function getSessionLogAction(tenantId: string, id: string) {
  await assertTenantAccess(tenantId);
  return getSessionLogById(id, tenantId);
}

export async function getSessionLogByBlockAction(
  tenantId: string,
  blockId: string,
) {
  await assertTenantAccess(tenantId);
  return getSessionLogByBlockId(blockId, tenantId);
}

export async function createSessionLogAction(
  tenantId: string,
  input: Omit<SessionLogInsert, "tenant_id">,
) {
  await assertTenantAccess(tenantId);
  await logAudit("session_log.create", { tenantId, input });
  const row = await createSessionLog(tenantId, input);
  revalidatePath("/scheduling");
  revalidatePath(`/students/${input.student_id}`);
  return row;
}

export async function updateSessionLogAction(
  tenantId: string,
  id: string,
  input: SessionLogUpdate,
) {
  await assertTenantAccess(tenantId);
  await logAudit("session_log.update", { tenantId, id, input });
  const row = await updateSessionLog(id, tenantId, input);
  revalidatePath("/scheduling");
  return row;
}

export async function deleteSessionLogAction(tenantId: string, id: string) {
  await assertTenantAccess(tenantId);
  await logAudit("session_log.delete", { tenantId, id });
  await deleteSessionLog(id, tenantId);
  revalidatePath("/scheduling");
}
