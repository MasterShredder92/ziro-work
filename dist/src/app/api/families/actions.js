"use server";
import { revalidatePath } from "next/cache";
import { createFamily, getFamilyById, listFamilies, updateFamily, } from "@data/families";
import { assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
export async function listFamiliesAction(tenantId, filter) {
    await assertTenantAccess(tenantId);
    return listFamilies(tenantId, filter);
}
export async function getFamilyAction(tenantId, id) {
    await assertTenantAccess(tenantId);
    return getFamilyById(id, tenantId);
}
export async function createFamilyAction(tenantId, input) {
    await assertTenantAccess(tenantId);
    await logAudit("families.create", { tenantId, input });
    const row = await createFamily(tenantId, input);
    revalidatePath("/families");
    return row;
}
export async function updateFamilyAction(tenantId, id, input) {
    await assertTenantAccess(tenantId);
    await logAudit("families.update", { tenantId, id, input });
    const row = await updateFamily(id, tenantId, input);
    revalidatePath("/families");
    revalidatePath(`/families/${id}`);
    return row;
}
