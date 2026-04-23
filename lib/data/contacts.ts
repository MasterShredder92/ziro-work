/**
 * Unified CRM contacts facade.
 *
 * "Contacts" in ZiroWork are a virtual projection over the existing
 * `leads`, `students`, `families`, and `teachers` tables. No dedicated
 * contacts table exists in the schema; this facade normalizes into the
 * {@link Contact} shape so the CRM UI can operate over a single surface
 * without duplicating legacy data.
 */
import type {
  Contact,
  ContactFilter,
  ContactKind,
  Family,
  Lead,
  Student,
  Teacher,
} from "@/lib/types/crm";
import { clientFor } from "./_client";

function composeName(
  first: string | null | undefined,
  last: string | null | undefined,
  fallback?: string | null,
): string {
  const parts = [first, last].filter(
    (s): s is string => typeof s === "string" && s.trim().length > 0,
  );
  if (parts.length > 0) return parts.join(" ");
  if (fallback && fallback.trim().length > 0) return fallback;
  return "Unnamed";
}

function projectStudent(row: Student): Contact {
  return {
    id: `student:${row.id}`,
    kind: "student",
    sourceId: row.id,
    tenantId: row.tenant_id,
    firstName: row.first_name ?? null,
    lastName: row.last_name ?? null,
    fullName: composeName(row.first_name, row.last_name),
    // email/phone dropped from students table; contact data lives on the family record
    email: null,
    phone: null,
    status: row.status ?? null,
    stage: row.status ?? null,
    familyId: row.family_id ?? null,
    teacherId: row.teacher_id ?? null,
    locationId: row.location_id ?? null,
    tags: row.tags ?? null,
    source: row.source ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    archived:
      row.status === "inactive" ||
      row.status === "archived" ||
      Boolean(row.deactivated_at),
  };
}

function projectLead(row: Lead): Contact {
  return {
    id: `lead:${row.id}`,
    kind: "lead",
    sourceId: row.id,
    tenantId: row.tenant_id,
    firstName: row.first_name ?? null,
    lastName: row.last_name ?? null,
    fullName: composeName(row.first_name, row.last_name),
    email: row.email ?? null,
    phone: row.phone ?? null,
    status: (row.stage as string | null) ?? null,
    stage: (row.stage as string | null) ?? null,
    familyId: row.family_id ?? null,
    teacherId: null,
    locationId: row.location_id ?? null,
    tags: null,
    source: row.source ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    archived: row.stage === "lost",
  };
}

function projectFamily(row: Family): Contact {
  const fallback =
    row.primary_contact_name ??
    row.parent_name ??
    row.name ??
    null;
  return {
    id: `family:${row.id}`,
    kind: "family",
    sourceId: row.id,
    tenantId: row.tenant_id,
    firstName: row.parent_first_name ?? null,
    lastName: row.parent_last_name ?? null,
    fullName: composeName(
      row.parent_first_name,
      row.parent_last_name,
      fallback,
    ),
    email: row.primary_email ?? null,
    phone: row.primary_phone ?? null,
    status: row.billing_status ?? null,
    stage: row.billing_status ?? null,
    familyId: row.id,
    teacherId: null,
    locationId: row.primary_location_id ?? null,
    tags: null,
    source: null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    archived: row.billing_status === "archived",
  };
}

function projectTeacher(row: Teacher): Contact {
  return {
    id: `teacher:${row.id}`,
    kind: "teacher",
    sourceId: row.id,
    tenantId: row.tenant_id,
    firstName: row.first_name ?? null,
    lastName: row.last_name ?? null,
    fullName: composeName(
      row.first_name,
      row.last_name,
      row.display_name ?? null,
    ),
    email: row.email ?? null,
    phone: row.phone ?? null,
    status: row.status ?? null,
    stage: row.status ?? null,
    familyId: null,
    teacherId: row.id,
    locationId: null,
    tags: null,
    source: null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    archived: row.is_active === false,
  };
}

function kindsFromFilter(
  filter?: ContactFilter,
): ContactKind[] {
  if (!filter?.kind) return ["lead", "student", "family", "teacher"];
  return Array.isArray(filter.kind) ? filter.kind : [filter.kind];
}

export async function listContacts(
  tenantId: string,
  filter?: ContactFilter,
  limit = 200,
): Promise<Contact[]> {
  const supabase = clientFor(tenantId);
  const kinds = kindsFromFilter(filter);
  const results: Contact[] = [];
  const search = filter?.search?.trim();

  if (kinds.includes("student")) {
    let q = supabase.from("students").select("*").eq("tenant_id", tenantId);
    if (filter?.familyId) q = q.eq("family_id", filter.familyId);
    if (filter?.teacherId) q = q.eq("teacher_id", filter.teacherId);
    if (filter?.locationId) q = q.eq("location_id", filter.locationId);
    if (filter?.status) q = q.eq("status", filter.status);
    if (search) {
      q = q.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%`,
      );
    }
    const { data, error } = await q.limit(limit);
    if (error) throw error;
    for (const row of (data ?? []) as Student[]) {
      const c = projectStudent(row);
      if (!filter?.includeArchived && c.archived) continue;
      results.push(c);
    }
  }

  if (kinds.includes("lead")) {
    let q = supabase.from("leads").select("*").eq("tenant_id", tenantId);
    if (filter?.familyId) q = q.eq("family_id", filter.familyId);
    if (filter?.locationId) q = q.eq("location_id", filter.locationId);
    if (filter?.stage) q = q.eq("stage", filter.stage);
    if (search) {
      q = q.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`,
      );
    }
    const { data, error } = await q.limit(limit);
    if (error) throw error;
    for (const row of (data ?? []) as Lead[]) {
      const c = projectLead(row);
      if (!filter?.includeArchived && c.archived) continue;
      results.push(c);
    }
  }

  if (kinds.includes("family")) {
    let q = supabase.from("families").select("*").eq("tenant_id", tenantId);
    if (filter?.locationId) q = q.eq("primary_location_id", filter.locationId);
    if (filter?.status) q = q.eq("billing_status", filter.status);
    if (search) {
      q = q.or(
        `name.ilike.%${search}%,primary_email.ilike.%${search}%,primary_phone.ilike.%${search}%,parent_name.ilike.%${search}%`,
      );
    }
    const { data, error } = await q.limit(limit);
    if (error) throw error;
    for (const row of (data ?? []) as Family[]) {
      const c = projectFamily(row);
      if (!filter?.includeArchived && c.archived) continue;
      results.push(c);
    }
  }

  if (kinds.includes("teacher")) {
    let q = supabase.from("teachers").select("*").eq("tenant_id", tenantId);
    if (filter?.status) q = q.eq("status", filter.status);
    if (search) {
      q = q.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,display_name.ilike.%${search}%`,
      );
    }
    const { data, error } = await q.limit(limit);
    if (error) throw error;
    for (const row of (data ?? []) as Teacher[]) {
      const c = projectTeacher(row);
      if (!filter?.includeArchived && c.archived) continue;
      results.push(c);
    }
  }

  results.sort((a, b) => {
    const ax = a.createdAt ?? "";
    const bx = b.createdAt ?? "";
    return bx.localeCompare(ax);
  });
  return results;
}

export async function getContactById(
  tenantId: string,
  contactId: string,
): Promise<Contact | null> {
  const [kind, sourceId] = contactId.split(":");
  if (!kind || !sourceId) return null;
  const supabase = clientFor(tenantId);
  switch (kind as ContactKind) {
    case "student": {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("id", sourceId)
        .maybeSingle();
      if (error) throw error;
      return data ? projectStudent(data as Student) : null;
    }
    case "lead": {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("id", sourceId)
        .maybeSingle();
      if (error) throw error;
      return data ? projectLead(data as Lead) : null;
    }
    case "family": {
      const { data, error } = await supabase
        .from("families")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("id", sourceId)
        .maybeSingle();
      if (error) throw error;
      return data ? projectFamily(data as Family) : null;
    }
    case "teacher": {
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("id", sourceId)
        .maybeSingle();
      if (error) throw error;
      return data ? projectTeacher(data as Teacher) : null;
    }
    default:
      return null;
  }
}

export type CreateContactInput = {
  kind: ContactKind;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  familyId?: string | null;
  locationId?: string | null;
  source?: string | null;
  tags?: string[] | null;
  notes?: string | null;
};

/**
 * Create a contact — dispatches to the underlying entity facade
 * based on {@link CreateContactInput.kind}.
 */
export async function createContact(
  tenantId: string,
  input: CreateContactInput,
): Promise<Contact> {
  const supabase = clientFor(tenantId);
  switch (input.kind) {
    case "lead": {
      const { data, error } = await supabase
        .from("leads")
        .insert({
          tenant_id: tenantId,
          first_name: input.firstName ?? "",
          last_name: input.lastName ?? null,
          email: input.email ?? null,
          phone: input.phone ?? null,
          family_id: input.familyId ?? null,
          location_id: input.locationId ?? null,
          source: input.source ?? null,
          stage: "new",
        })
        .select("*")
        .single();
      if (error) throw error;
      return projectLead(data as Lead);
    }
    case "student": {
      const { data, error } = await supabase
        .from("students")
        .insert({
          tenant_id: tenantId,
          first_name: input.firstName ?? "",
          last_name: input.lastName ?? "",
          email: input.email ?? null,
          phone: input.phone ?? null,
          family_id: input.familyId ?? null,
          location_id: input.locationId ?? null,
          source: input.source ?? null,
          status: "prospect",
          tags: input.tags ?? null,
          notes: input.notes ?? null,
        })
        .select("*")
        .single();
      if (error) throw error;
      return projectStudent(data as Student);
    }
    case "family": {
      const name = [input.firstName, input.lastName]
        .filter((s): s is string => Boolean(s && s.length > 0))
        .join(" ")
        .trim();
      const { data, error } = await supabase
        .from("families")
        .insert({
          tenant_id: tenantId,
          name: name || "New Family",
          parent_first_name: input.firstName ?? null,
          parent_last_name: input.lastName ?? null,
          primary_email: input.email ?? null,
          primary_phone: input.phone ?? null,
          primary_location_id: input.locationId ?? null,
        })
        .select("*")
        .single();
      if (error) throw error;
      return projectFamily(data as Family);
    }
    case "teacher": {
      const { data, error } = await supabase
        .from("teachers")
        .insert({
          tenant_id: tenantId,
          first_name: input.firstName ?? null,
          last_name: input.lastName ?? null,
          email: input.email ?? null,
          phone: input.phone ?? null,
          instruments: [],
          status: "onboarding",
          is_active: true,
        })
        .select("*")
        .single();
      if (error) throw error;
      return projectTeacher(data as Teacher);
    }
    default: {
      const never: never = input.kind;
      throw new Error(`Unsupported contact kind: ${String(never)}`);
    }
  }
}

export type UpdateContactInput = Partial<{
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
  tags: string[] | null;
  notes: string | null;
}>;

export async function updateContact(
  tenantId: string,
  contactId: string,
  input: UpdateContactInput,
): Promise<Contact | null> {
  const [kind, sourceId] = contactId.split(":");
  if (!kind || !sourceId) return null;
  const supabase = clientFor(tenantId);

  const nameFields: Record<string, unknown> = {};
  if (input.firstName !== undefined) nameFields.first_name = input.firstName;
  if (input.lastName !== undefined) nameFields.last_name = input.lastName;

  switch (kind as ContactKind) {
    case "student": {
      const patch: Record<string, unknown> = { ...nameFields };
      if (input.email !== undefined) patch.email = input.email;
      if (input.phone !== undefined) patch.phone = input.phone;
      if (input.status !== undefined) patch.status = input.status;
      if (input.tags !== undefined) patch.tags = input.tags;
      if (input.notes !== undefined) patch.notes = input.notes;
      patch.updated_at = new Date().toISOString();
      const { data, error } = await supabase
        .from("students")
        .update(patch)
        .eq("tenant_id", tenantId)
        .eq("id", sourceId)
        .select("*")
        .single();
      if (error) throw error;
      return projectStudent(data as Student);
    }
    case "lead": {
      const patch: Record<string, unknown> = { ...nameFields };
      if (input.email !== undefined) patch.email = input.email;
      if (input.phone !== undefined) patch.phone = input.phone;
      if (input.status !== undefined) patch.stage = input.status;
      patch.updated_at = new Date().toISOString();
      const { data, error } = await supabase
        .from("leads")
        .update(patch)
        .eq("tenant_id", tenantId)
        .eq("id", sourceId)
        .select("*")
        .single();
      if (error) throw error;
      return projectLead(data as Lead);
    }
    case "family": {
      const patch: Record<string, unknown> = {};
      if (input.firstName !== undefined)
        patch.parent_first_name = input.firstName;
      if (input.lastName !== undefined) patch.parent_last_name = input.lastName;
      if (input.email !== undefined) patch.primary_email = input.email;
      if (input.phone !== undefined) patch.primary_phone = input.phone;
      if (input.status !== undefined) patch.billing_status = input.status;
      patch.updated_at = new Date().toISOString();
      const { data, error } = await supabase
        .from("families")
        .update(patch)
        .eq("tenant_id", tenantId)
        .eq("id", sourceId)
        .select("*")
        .single();
      if (error) throw error;
      return projectFamily(data as Family);
    }
    case "teacher": {
      const patch: Record<string, unknown> = { ...nameFields };
      if (input.email !== undefined) patch.email = input.email;
      if (input.phone !== undefined) patch.phone = input.phone;
      if (input.status !== undefined) patch.status = input.status;
      patch.updated_at = new Date().toISOString();
      const { data, error } = await supabase
        .from("teachers")
        .update(patch)
        .eq("tenant_id", tenantId)
        .eq("id", sourceId)
        .select("*")
        .single();
      if (error) throw error;
      return projectTeacher(data as Teacher);
    }
    default:
      return null;
  }
}

export async function archiveContact(
  tenantId: string,
  contactId: string,
): Promise<void> {
  const [kind, sourceId] = contactId.split(":");
  if (!kind || !sourceId) return;
  const supabase = clientFor(tenantId);
  const nowIso = new Date().toISOString();
  switch (kind as ContactKind) {
    case "student":
      await supabase
        .from("students")
        .update({
          status: "inactive",
          deactivated_at: nowIso,
          updated_at: nowIso,
        })
        .eq("tenant_id", tenantId)
        .eq("id", sourceId);
      return;
    case "lead":
      await supabase
        .from("leads")
        .update({ stage: "lost", updated_at: nowIso })
        .eq("tenant_id", tenantId)
        .eq("id", sourceId);
      return;
    case "family":
      await supabase
        .from("families")
        .update({ billing_status: "archived", updated_at: nowIso })
        .eq("tenant_id", tenantId)
        .eq("id", sourceId);
      return;
    case "teacher":
      await supabase
        .from("teachers")
        .update({
          status: "inactive",
          is_active: false,
          termination_date: nowIso,
          updated_at: nowIso,
        })
        .eq("tenant_id", tenantId)
        .eq("id", sourceId);
      return;
  }
}

/**
 * Merge two contacts of the same kind. Keeps the `keep` contact and
 * soft-archives the `remove` contact, copying non-empty fields forward.
 * For student/family/teacher merges we re-parent child rows where
 * straightforward.
 */
export async function mergeContacts(
  tenantId: string,
  keepContactId: string,
  removeContactId: string,
): Promise<Contact | null> {
  const [keepKind, keepId] = keepContactId.split(":");
  const [removeKind, removeId] = removeContactId.split(":");
  if (!keepKind || !keepId || !removeKind || !removeId) return null;
  if (keepKind !== removeKind) {
    throw new Error(
      `Cannot merge contacts of different kinds: ${keepKind} vs ${removeKind}`,
    );
  }
  const supabase = clientFor(tenantId);
  const keep = await getContactById(tenantId, keepContactId);
  const remove = await getContactById(tenantId, removeContactId);
  if (!keep || !remove) return keep;

  const patch: UpdateContactInput = {};
  if (!keep.email && remove.email) patch.email = remove.email;
  if (!keep.phone && remove.phone) patch.phone = remove.phone;
  if (!keep.firstName && remove.firstName) patch.firstName = remove.firstName;
  if (!keep.lastName && remove.lastName) patch.lastName = remove.lastName;

  const merged = Object.keys(patch).length
    ? await updateContact(tenantId, keepContactId, patch)
    : keep;

  if (keepKind === "family") {
    await supabase
      .from("students")
      .update({ family_id: keepId, updated_at: new Date().toISOString() })
      .eq("tenant_id", tenantId)
      .eq("family_id", removeId);
  }

  await archiveContact(tenantId, removeContactId);
  return merged;
}
