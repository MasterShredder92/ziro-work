"use server";

import { revalidatePath } from "next/cache";
import {
  createFamily,
  getFamilyById,
  listFamilies,
  updateFamily,
  type FamilyFilter,
} from "@data/families";
import type { FamilyInsert, FamilyUpdate } from "@/lib/types/entities";
import { assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";

export async function listFamiliesAction(
  tenantId: string,
  filter?: FamilyFilter,
) {
  await assertTenantAccess(tenantId);
  return listFamilies(tenantId, filter);
}

export async function getFamilyAction(tenantId: string, id: string) {
  await assertTenantAccess(tenantId);
  return getFamilyById(id, tenantId);
}

export async function createFamilyAction(
  tenantId: string,
  input: Omit<FamilyInsert, "tenant_id">,
) {
  await assertTenantAccess(tenantId);
  await logAudit("families.create", { tenantId, input });
  const row = await createFamily(tenantId, input);
  revalidatePath("/families");
  return row;
}

export async function updateFamilyAction(
  tenantId: string,
  id: string,
  input: FamilyUpdate,
) {
  await assertTenantAccess(tenantId);
  await logAudit("families.update", { tenantId, id, input });
  const row = await updateFamily(id, tenantId, input);
  revalidatePath("/families");
  revalidatePath(`/families/${id}`);
  return row;
}
