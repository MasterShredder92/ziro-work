import { clientFor } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing } from "./_missingTable";

export type FormRow = {
  id: string;
  tenant_id: string;
  name: string;
  slug: string | null;
  description: string | null;
  status: "draft" | "published" | "archived";
  is_public: boolean;
  submit_label: string | null;
  success_message: string | null;
  success_redirect_url: string | null;
  settings: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

export type FormFieldRow = {
  id: string;
  form_id: string;
  tenant_id: string;
  section_id: string | null;
  section_title: string | null;
  field_key: string;
  label: string;
  field_type: string;
  placeholder: string | null;
  help_text: string | null;
  required: boolean;
  position: number;
  options: Array<Record<string, unknown>>;
  validation_rules: Array<Record<string, unknown>>;
  default_value: unknown;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type FormSubmissionRow = {
  id: string;
  form_id: string;
  tenant_id: string;
  status: "started" | "completed" | "abandoned";
  submitted_by: string | null;
  profile_id: string | null;
  answers: Array<Record<string, unknown>>;
  metadata: Record<string, unknown> | null;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  created_at: string;
  updated_at: string;
};

export type FormListFilter = {
  includeArchived?: boolean;
  status?: FormRow["status"];
  search?: string;
};

export type SubmissionFilter = {
  formId?: string;
  status?: string;
  profileId?: string;
};

const FORMS_TABLE = "forms";
const FIELDS_TABLE = "form_fields";
const SUBMISSIONS_TABLE = "form_submissions";

type GlobalWithStores = typeof globalThis & {
  __ziro_forms_store?: Map<string, FormRow>;
  __ziro_form_fields_store?: Map<string, FormFieldRow>;
  __ziro_form_submissions_store?: Map<string, FormSubmissionRow>;
};

function formsStore(): Map<string, FormRow> {
  const g = globalThis as GlobalWithStores;
  if (!g.__ziro_forms_store) g.__ziro_forms_store = new Map();
  return g.__ziro_forms_store;
}

function fieldsStore(): Map<string, FormFieldRow> {
  const g = globalThis as GlobalWithStores;
  if (!g.__ziro_form_fields_store) g.__ziro_form_fields_store = new Map();
  return g.__ziro_form_fields_store;
}

function submissionsStore(): Map<string, FormSubmissionRow> {
  const g = globalThis as GlobalWithStores;
  if (!g.__ziro_form_submissions_store)
    g.__ziro_form_submissions_store = new Map();
  return g.__ziro_form_submissions_store;
}

function nowIso(): string {
  return new Date().toISOString();
}

function uuid(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `form_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

function slugify(v: string | null | undefined): string {
  return (v ?? "form")
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 64) || "form";
}

function listFormsFromStore(
  tenantId: string,
  filter?: FormListFilter,
): FormRow[] {
  const out: FormRow[] = [];
  for (const row of formsStore().values()) {
    if (row.tenant_id !== tenantId) continue;
    if (!filter?.includeArchived && row.status === "archived") continue;
    if (filter?.status && row.status !== filter.status) continue;
    if (filter?.search && filter.search.trim().length > 0) {
      const s = filter.search.trim().toLowerCase();
      const hit =
        row.name.toLowerCase().includes(s) ||
        (row.slug?.toLowerCase().includes(s) ?? false) ||
        (row.description?.toLowerCase().includes(s) ?? false);
      if (!hit) continue;
    }
    out.push(row);
  }
  return out.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function listForms(
  tenantId: string,
  filter?: FormListFilter,
): Promise<FormRow[]> {
  if (tableMissing(FORMS_TABLE)) return listFormsFromStore(tenantId, filter);
  try {
    const supabase = clientFor(tenantId);
    let query = supabase
      .from(FORMS_TABLE)
      .select("*")
      .eq("tenant_id", tenantId);
    if (!filter?.includeArchived) query = query.neq("status", "archived");
    if (filter?.status) query = query.eq("status", filter.status);
    const { data, error } = await query.order("updated_at", {
      ascending: false,
    });
    if (error) throw error;
    return (data ?? []) as unknown as FormRow[];
  } catch (err) {
    if (isMissingTableError(err, FORMS_TABLE)) {
      markTableMissing(FORMS_TABLE);
      return listFormsFromStore(tenantId, filter);
    }
    throw err;
  }
}

export async function getForm(
  id: string,
  tenantId: string,
): Promise<FormRow | null> {
  if (tableMissing(FORMS_TABLE)) {
    const row = formsStore().get(id);
    if (!row || row.tenant_id !== tenantId) return null;
    return row;
  }
  try {
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
      .from(FORMS_TABLE)
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data ?? null) as unknown as FormRow | null;
  } catch (err) {
    if (isMissingTableError(err, FORMS_TABLE)) {
      markTableMissing(FORMS_TABLE);
      return getForm(id, tenantId);
    }
    throw err;
  }
}

export async function getPublicFormBySlug(
  slug: string,
  tenantId: string,
): Promise<FormRow | null> {
  if (tableMissing(FORMS_TABLE)) {
    for (const row of formsStore().values()) {
      if (
        row.tenant_id === tenantId &&
        row.slug === slug &&
        row.is_public === true
      ) {
        return row;
      }
    }
    return null;
  }
  try {
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
      .from(FORMS_TABLE)
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("slug", slug)
      .eq("is_public", true)
      .maybeSingle();
    if (error) throw error;
    return (data ?? null) as unknown as FormRow | null;
  } catch (err) {
    if (isMissingTableError(err, FORMS_TABLE)) {
      markTableMissing(FORMS_TABLE);
      return getPublicFormBySlug(slug, tenantId);
    }
    throw err;
  }
}

export type UpsertFormInput = {
  id?: string;
  name?: string;
  slug?: string | null;
  description?: string | null;
  status?: FormRow["status"];
  is_public?: boolean;
  submit_label?: string | null;
  success_message?: string | null;
  success_redirect_url?: string | null;
  settings?: Record<string, unknown> | null;
  created_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
};

function mergeFormUpsert(
  existing: FormRow | undefined,
  tenantId: string,
  input: UpsertFormInput,
): FormRow {
  const id = input.id ?? existing?.id ?? uuid();
  const now = nowIso();
  const name = input.name ?? existing?.name ?? "Untitled form";
  const slugSource = input.slug ?? existing?.slug ?? slugify(name);
  return {
    id,
    tenant_id: tenantId,
    name,
    slug: slugSource,
    description: input.description ?? existing?.description ?? null,
    status: input.status ?? existing?.status ?? "draft",
    is_public: input.is_public ?? existing?.is_public ?? false,
    submit_label: input.submit_label ?? existing?.submit_label ?? null,
    success_message:
      input.success_message ?? existing?.success_message ?? null,
    success_redirect_url:
      input.success_redirect_url ?? existing?.success_redirect_url ?? null,
    settings: input.settings ?? existing?.settings ?? {},
    created_at: input.created_at ?? existing?.created_at ?? now,
    updated_at: now,
    created_by: input.created_by ?? existing?.created_by ?? null,
    updated_by:
      input.updated_by ??
      input.created_by ??
      existing?.updated_by ??
      existing?.created_by ??
      null,
  };
}

export async function upsertForm(
  tenantId: string,
  input: UpsertFormInput,
): Promise<FormRow> {
  const existing = input.id ? await getForm(input.id, tenantId) : null;
  const next = mergeFormUpsert(existing ?? undefined, tenantId, input);
  if (tableMissing(FORMS_TABLE)) {
    formsStore().set(next.id, next);
    return next;
  }
  try {
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
      .from(FORMS_TABLE)
      .upsert(next, { onConflict: "id" })
      .select("*")
      .single();
    if (error) throw error;
    return data as unknown as FormRow;
  } catch (err) {
    if (isMissingTableError(err, FORMS_TABLE)) {
      markTableMissing(FORMS_TABLE);
      formsStore().set(next.id, next);
      return next;
    }
    throw err;
  }
}

export async function deleteForm(
  formId: string,
  tenantId: string,
): Promise<void> {
  if (tableMissing(FORMS_TABLE)) {
    const row = formsStore().get(formId);
    if (row && row.tenant_id === tenantId) formsStore().delete(formId);
    for (const [fid, f] of fieldsStore()) {
      if (f.tenant_id === tenantId && f.form_id === formId) {
        fieldsStore().delete(fid);
      }
    }
    return;
  }
  try {
    const supabase = clientFor(tenantId);
    const { error } = await supabase
      .from(FORMS_TABLE)
      .delete()
      .eq("tenant_id", tenantId)
      .eq("id", formId);
    if (error) throw error;
  } catch (err) {
    if (isMissingTableError(err, FORMS_TABLE)) {
      markTableMissing(FORMS_TABLE);
      return deleteForm(formId, tenantId);
    }
    throw err;
  }
}

function listFieldsFromStore(
  formId: string,
  tenantId: string,
): FormFieldRow[] {
  const out: FormFieldRow[] = [];
  for (const row of fieldsStore().values()) {
    if (row.tenant_id === tenantId && row.form_id === formId) out.push(row);
  }
  return out.sort((a, b) => a.position - b.position);
}

export async function listFormFields(
  formId: string,
  tenantId: string,
): Promise<FormFieldRow[]> {
  if (tableMissing(FIELDS_TABLE)) return listFieldsFromStore(formId, tenantId);
  try {
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
      .from(FIELDS_TABLE)
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("form_id", formId)
      .order("position", { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as FormFieldRow[];
  } catch (err) {
    if (isMissingTableError(err, FIELDS_TABLE)) {
      markTableMissing(FIELDS_TABLE);
      return listFieldsFromStore(formId, tenantId);
    }
    throw err;
  }
}

export type UpsertFormFieldInput = {
  id?: string;
  form_id: string;
  section_id?: string | null;
  section_title?: string | null;
  field_key: string;
  label: string;
  field_type: string;
  placeholder?: string | null;
  help_text?: string | null;
  required?: boolean;
  position?: number;
  options?: Array<Record<string, unknown>>;
  validation_rules?: Array<Record<string, unknown>>;
  default_value?: unknown;
  metadata?: Record<string, unknown> | null;
};

async function getFieldById(
  id: string,
  tenantId: string,
): Promise<FormFieldRow | null> {
  if (tableMissing(FIELDS_TABLE)) {
    const row = fieldsStore().get(id);
    if (!row || row.tenant_id !== tenantId) return null;
    return row;
  }
  try {
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
      .from(FIELDS_TABLE)
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data ?? null) as unknown as FormFieldRow | null;
  } catch (err) {
    if (isMissingTableError(err, FIELDS_TABLE)) {
      markTableMissing(FIELDS_TABLE);
      return getFieldById(id, tenantId);
    }
    throw err;
  }
}

function mergeFieldUpsert(
  existing: FormFieldRow | undefined,
  tenantId: string,
  input: UpsertFormFieldInput,
): FormFieldRow {
  const id = input.id ?? existing?.id ?? uuid();
  const now = nowIso();
  return {
    id,
    form_id: input.form_id,
    tenant_id: tenantId,
    section_id: input.section_id ?? existing?.section_id ?? null,
    section_title: input.section_title ?? existing?.section_title ?? null,
    field_key: input.field_key ?? existing?.field_key ?? id,
    label: input.label ?? existing?.label ?? "Untitled field",
    field_type: input.field_type ?? existing?.field_type ?? "text",
    placeholder: input.placeholder ?? existing?.placeholder ?? null,
    help_text: input.help_text ?? existing?.help_text ?? null,
    required: input.required ?? existing?.required ?? false,
    position:
      typeof input.position === "number"
        ? input.position
        : existing?.position ?? listFieldsFromStore(input.form_id, tenantId).length,
    options: input.options ?? existing?.options ?? [],
    validation_rules:
      input.validation_rules ?? existing?.validation_rules ?? [],
    default_value:
      input.default_value !== undefined
        ? input.default_value
        : existing?.default_value ?? null,
    metadata: input.metadata ?? existing?.metadata ?? {},
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };
}

export async function upsertFormField(
  tenantId: string,
  input: UpsertFormFieldInput,
): Promise<FormFieldRow> {
  const existing = input.id ? await getFieldById(input.id, tenantId) : null;
  const next = mergeFieldUpsert(existing ?? undefined, tenantId, input);
  if (tableMissing(FIELDS_TABLE)) {
    fieldsStore().set(next.id, next);
    return next;
  }
  try {
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
      .from(FIELDS_TABLE)
      .upsert(next, { onConflict: "id" })
      .select("*")
      .single();
    if (error) throw error;
    return data as unknown as FormFieldRow;
  } catch (err) {
    if (isMissingTableError(err, FIELDS_TABLE)) {
      markTableMissing(FIELDS_TABLE);
      fieldsStore().set(next.id, next);
      return next;
    }
    throw err;
  }
}

export async function deleteFormField(
  fieldId: string,
  tenantId: string,
): Promise<void> {
  if (tableMissing(FIELDS_TABLE)) {
    const row = fieldsStore().get(fieldId);
    if (row && row.tenant_id === tenantId) fieldsStore().delete(fieldId);
    return;
  }
  try {
    const supabase = clientFor(tenantId);
    const { error } = await supabase
      .from(FIELDS_TABLE)
      .delete()
      .eq("tenant_id", tenantId)
      .eq("id", fieldId);
    if (error) throw error;
  } catch (err) {
    if (isMissingTableError(err, FIELDS_TABLE)) {
      markTableMissing(FIELDS_TABLE);
      return deleteFormField(fieldId, tenantId);
    }
    throw err;
  }
}

function listSubmissionsFromStore(
  tenantId: string,
  filter?: SubmissionFilter,
): FormSubmissionRow[] {
  const out: FormSubmissionRow[] = [];
  for (const row of submissionsStore().values()) {
    if (row.tenant_id !== tenantId) continue;
    if (filter?.formId && row.form_id !== filter.formId) continue;
    if (filter?.status && row.status !== filter.status) continue;
    if (filter?.profileId && row.profile_id !== filter.profileId) continue;
    out.push(row);
  }
  return out.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function listFormSubmissions(
  tenantId: string,
  filter?: SubmissionFilter,
): Promise<FormSubmissionRow[]> {
  if (tableMissing(SUBMISSIONS_TABLE))
    return listSubmissionsFromStore(tenantId, filter);
  try {
    const supabase = clientFor(tenantId);
    let query = supabase
      .from(SUBMISSIONS_TABLE)
      .select("*")
      .eq("tenant_id", tenantId);
    if (filter?.formId) query = query.eq("form_id", filter.formId);
    if (filter?.status) query = query.eq("status", filter.status);
    if (filter?.profileId) query = query.eq("profile_id", filter.profileId);
    const { data, error } = await query.order("created_at", {
      ascending: false,
    });
    if (error) throw error;
    return (data ?? []) as unknown as FormSubmissionRow[];
  } catch (err) {
    if (isMissingTableError(err, SUBMISSIONS_TABLE)) {
      markTableMissing(SUBMISSIONS_TABLE);
      return listSubmissionsFromStore(tenantId, filter);
    }
    throw err;
  }
}

export async function getFormSubmission(
  submissionId: string,
  tenantId: string,
): Promise<FormSubmissionRow | null> {
  if (tableMissing(SUBMISSIONS_TABLE)) {
    const row = submissionsStore().get(submissionId);
    if (!row || row.tenant_id !== tenantId) return null;
    return row;
  }
  try {
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
      .from(SUBMISSIONS_TABLE)
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("id", submissionId)
      .maybeSingle();
    if (error) throw error;
    return (data ?? null) as unknown as FormSubmissionRow | null;
  } catch (err) {
    if (isMissingTableError(err, SUBMISSIONS_TABLE)) {
      markTableMissing(SUBMISSIONS_TABLE);
      return getFormSubmission(submissionId, tenantId);
    }
    throw err;
  }
}

export type UpsertFormSubmissionInput = {
  id?: string;
  form_id: string;
  status?: FormSubmissionRow["status"];
  submitted_by?: string | null;
  profile_id?: string | null;
  answers: Array<Record<string, unknown>>;
  metadata?: Record<string, unknown> | null;
  started_at?: string | null;
  completed_at?: string | null;
  duration_ms?: number | null;
  created_at?: string;
};

export async function upsertFormSubmission(
  tenantId: string,
  input: UpsertFormSubmissionInput,
): Promise<FormSubmissionRow> {
  const existing = input.id
    ? await getFormSubmission(input.id, tenantId)
    : null;
  const now = nowIso();
  const next: FormSubmissionRow = {
    id: input.id ?? existing?.id ?? uuid(),
    form_id: input.form_id,
    tenant_id: tenantId,
    status: input.status ?? existing?.status ?? "completed",
    submitted_by:
      input.submitted_by ?? existing?.submitted_by ?? null,
    profile_id: input.profile_id ?? existing?.profile_id ?? null,
    answers: input.answers ?? existing?.answers ?? [],
    metadata: input.metadata ?? existing?.metadata ?? {},
    started_at: input.started_at ?? existing?.started_at ?? now,
    completed_at:
      input.completed_at ?? existing?.completed_at ?? null,
    duration_ms: input.duration_ms ?? existing?.duration_ms ?? null,
    created_at: input.created_at ?? existing?.created_at ?? now,
    updated_at: now,
  };
  if (tableMissing(SUBMISSIONS_TABLE)) {
    submissionsStore().set(next.id, next);
    return next;
  }
  try {
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
      .from(SUBMISSIONS_TABLE)
      .upsert(next, { onConflict: "id" })
      .select("*")
      .single();
    if (error) throw error;
    return data as unknown as FormSubmissionRow;
  } catch (err) {
    if (isMissingTableError(err, SUBMISSIONS_TABLE)) {
      markTableMissing(SUBMISSIONS_TABLE);
      submissionsStore().set(next.id, next);
      return next;
    }
    throw err;
  }
}
