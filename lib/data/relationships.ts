/**
 * Relationships facade — derives family/contact relationships from existing
 * tables. The ZiroWork schema does not have a dedicated relationships table;
 * the primary guardian link is implicit on `families` and child rows use
 * `students.family_id`.
 */
import type {
  Relationship,
  RelationshipRole,
  Family,
  Student,
} from "@/lib/types/crm";
import { clientFor } from "./_client";

export async function listRelationshipsForFamily(
  tenantId: string,
  familyId: string,
): Promise<Relationship[]> {
  const supabase = clientFor(tenantId);

  const { data: familyRow, error: familyErr } = await supabase
    .from("families")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", familyId)
    .maybeSingle();
  if (familyErr) throw familyErr;

  const { data: students, error: studentErr } = await supabase
    .from("students")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("family_id", familyId);
  if (studentErr) throw studentErr;

  const rels: Relationship[] = [];
  if (familyRow) {
    const f = familyRow as Family;
    if (f.primary_contact_name || f.primary_email || f.primary_phone) {
      rels.push({
        id: `family:${familyId}:primary`,
        tenantId,
        familyId,
        contactId: `family:${familyId}`,
        contactKind: "family",
        role: "primary_guardian",
        isPrimary: true,
        createdAt: f.created_at ?? null,
      });
    }
  }

  for (const s of (students ?? []) as Student[]) {
    rels.push({
      id: `student:${s.id}:member`,
      tenantId,
      familyId,
      contactId: `student:${s.id}`,
      contactKind: "student",
      role: "student",
      isPrimary: false,
      createdAt: s.created_at ?? null,
    });
  }

  return rels;
}

export async function addStudentToFamily(
  tenantId: string,
  studentId: string,
  familyId: string,
): Promise<void> {
  const supabase = clientFor(tenantId);
  const { error } = await supabase
    .from("students")
    .update({ family_id: familyId, updated_at: new Date().toISOString() })
    .eq("tenant_id", tenantId)
    .eq("id", studentId);
  if (error) throw error;
}

export async function removeStudentFromFamily(
  tenantId: string,
  studentId: string,
): Promise<void> {
  const supabase = clientFor(tenantId);
  const { error } = await supabase
    .from("students")
    .update({ family_id: null, updated_at: new Date().toISOString() })
    .eq("tenant_id", tenantId)
    .eq("id", studentId);
  if (error) throw error;
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
  const supabase = clientFor(tenantId);
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.firstName !== undefined)
    patch.parent_first_name = input.firstName;
  if (input.lastName !== undefined) patch.parent_last_name = input.lastName;
  if (input.email !== undefined) patch.primary_email = input.email;
  if (input.phone !== undefined) patch.primary_phone = input.phone;
  const contactName = [input.firstName, input.lastName]
    .filter((s): s is string => Boolean(s && s.length > 0))
    .join(" ")
    .trim();
  if (contactName) patch.primary_contact_name = contactName;
  if (input.relationship) patch.emergency_contact_relationship = input.relationship;

  const { error } = await supabase
    .from("families")
    .update(patch)
    .eq("tenant_id", tenantId)
    .eq("id", familyId);
  if (error) throw error;
}

export async function listFamiliesForStudent(
  tenantId: string,
  studentId: string,
): Promise<string[]> {
  const supabase = clientFor(tenantId);
  const { data, error } = await supabase
    .from("students")
    .select("family_id")
    .eq("tenant_id", tenantId)
    .eq("id", studentId)
    .maybeSingle();
  if (error) throw error;
  const familyId = (data as { family_id: string | null } | null)?.family_id;
  return familyId ? [familyId] : [];
}

export type { RelationshipRole };
