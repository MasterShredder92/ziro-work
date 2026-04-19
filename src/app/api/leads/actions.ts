"use server";

import { revalidatePath } from "next/cache";
import {
  convertLeadToStudent,
  createLead,
  deleteLead,
  getLeadById,
  listLeads,
  updateLead,
  type LeadFilter,
} from "@data/leads";
import type { LeadInsert, LeadUpdate } from "@/lib/types/entities";
import { assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";

export async function listLeadsAction(tenantId: string, filter?: LeadFilter) {
  await assertTenantAccess(tenantId);
  return listLeads(tenantId, filter);
}

export async function getLeadAction(tenantId: string, id: string) {
  await assertTenantAccess(tenantId);
  return getLeadById(id, tenantId);
}

export async function createLeadAction(
  tenantId: string,
  input: Omit<LeadInsert, "tenant_id">,
) {
  await assertTenantAccess(tenantId);
  await logAudit("leads.create", { tenantId, input });
  const row = await createLead(tenantId, input);
  revalidatePath("/leads");
  return row;
}

export async function updateLeadAction(
  tenantId: string,
  id: string,
  input: LeadUpdate,
) {
  await assertTenantAccess(tenantId);
  await logAudit("leads.update", { tenantId, id, input });
  const row = await updateLead(id, tenantId, input);
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  return row;
}

export async function deleteLeadAction(tenantId: string, id: string) {
  await assertTenantAccess(tenantId);
  await logAudit("leads.delete", { tenantId, id });
  await deleteLead(id, tenantId);
  revalidatePath("/leads");
}

export async function convertLeadAction(
  tenantId: string,
  leadId: string,
  studentId: string,
) {
  await assertTenantAccess(tenantId);
  await logAudit("leads.convert", { tenantId, leadId, studentId });
  const row = await convertLeadToStudent(leadId, studentId, tenantId);
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/students");
  return row;
}
