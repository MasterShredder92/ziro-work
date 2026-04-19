import "server-only";
import {
  deleteForm as deleteFormRaw,
  deleteFormField as deleteFormFieldRaw,
  getForm as getFormRaw,
  getFormSubmission as getFormSubmissionRaw,
  getPublicFormBySlug as getPublicFormBySlugRaw,
  listFormFields as listFormFieldsRaw,
  listForms as listFormsRaw,
  listFormSubmissions as listFormSubmissionsRaw,
  upsertForm as upsertFormRaw,
  upsertFormField as upsertFormFieldRaw,
  upsertFormSubmission as upsertFormSubmissionRaw,
  type FormFieldRow,
  type FormListFilter,
  type FormRow,
  type FormSubmissionRow,
  type SubmissionFilter,
} from "@data/forms";
import type {
  Form,
  FormField,
  FormFieldInput,
  FormFieldOption,
  FormInput,
  FormSection,
  FormSubmission,
  FormSubmissionAnswer,
  FormSubmissionStatus,
  FormValidationRule,
  FormWithFields,
} from "./types";

function mapForm(row: FormRow): Form {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    status: (row.status as Form["status"]) ?? "draft",
    isPublic: row.is_public,
    submitLabel: row.submit_label,
    successMessage: row.success_message,
    successRedirectUrl: row.success_redirect_url,
    settings: row.settings ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

function mapField(row: FormFieldRow): FormField {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    formId: row.form_id,
    sectionId: row.section_id,
    sectionTitle: row.section_title,
    fieldKey: row.field_key,
    label: row.label,
    fieldType: row.field_type,
    placeholder: row.placeholder,
    helpText: row.help_text,
    required: row.required,
    position: row.position,
    options: (row.options ?? []) as unknown as FormFieldOption[],
    validationRules: (row.validation_rules ?? []) as unknown as FormValidationRule[],
    defaultValue: row.default_value,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSubmission(row: FormSubmissionRow): FormSubmission {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    formId: row.form_id,
    status: (row.status as FormSubmissionStatus) ?? "completed",
    submittedBy: row.submitted_by,
    profileId: row.profile_id,
    answers: (row.answers ?? []) as unknown as FormSubmissionAnswer[],
    metadata: row.metadata ?? {},
    startedAt: row.started_at,
    completedAt: row.completed_at,
    durationMs: row.duration_ms,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listForms(
  tenantId: string,
  filter?: FormListFilter,
): Promise<Form[]> {
  const rows = await listFormsRaw(tenantId, filter);
  return rows.map(mapForm);
}

export async function getForm(
  formId: string,
  tenantId: string,
): Promise<Form | null> {
  const row = await getFormRaw(formId, tenantId);
  return row ? mapForm(row) : null;
}

export async function getPublicFormBySlug(
  slug: string,
  tenantId: string,
): Promise<Form | null> {
  const row = await getPublicFormBySlugRaw(slug, tenantId);
  return row ? mapForm(row) : null;
}

export async function listFormFields(
  formId: string,
  tenantId: string,
): Promise<FormField[]> {
  const rows = await listFormFieldsRaw(formId, tenantId);
  return rows.map(mapField);
}

export async function listFormSubmissions(
  tenantId: string,
  filter?: SubmissionFilter,
): Promise<FormSubmission[]> {
  const rows = await listFormSubmissionsRaw(tenantId, filter);
  return rows.map(mapSubmission);
}

export async function getSubmission(
  submissionId: string,
  tenantId: string,
): Promise<FormSubmission | null> {
  const row = await getFormSubmissionRaw(submissionId, tenantId);
  return row ? mapSubmission(row) : null;
}

function deriveSections(fields: FormField[]): FormSection[] {
  const out: FormSection[] = [];
  const seen = new Map<string, FormSection>();
  let order = 0;
  for (const field of fields) {
    if (!field.sectionId) continue;
    if (seen.has(field.sectionId)) continue;
    const section: FormSection = {
      id: field.sectionId,
      title: field.sectionTitle ?? "Section",
      order: order++,
    };
    seen.set(field.sectionId, section);
    out.push(section);
  }
  return out;
}

export async function getFormWithFields(
  formId: string,
  tenantId: string,
): Promise<FormWithFields | null> {
  const form = await getForm(formId, tenantId);
  if (!form) return null;
  const fields = await listFormFields(formId, tenantId);
  const sections = deriveSections(fields);
  return { form, fields, sections };
}

export async function createForm(
  tenantId: string,
  data: FormInput,
): Promise<Form> {
  const row = await upsertFormRaw(tenantId, {
    name: data.name,
    slug: data.slug ?? null,
    description: data.description ?? null,
    status: data.status ?? "draft",
    is_public: data.isPublic === true,
    submit_label: data.submitLabel ?? null,
    success_message: data.successMessage ?? null,
    success_redirect_url: data.successRedirectUrl ?? null,
    settings: data.settings ?? {},
    created_by: data.createdBy ?? null,
    updated_by: data.updatedBy ?? data.createdBy ?? null,
  });
  return mapForm(row);
}

export async function updateForm(
  formId: string,
  tenantId: string,
  data: Partial<FormInput>,
): Promise<Form> {
  const existing = await getFormRaw(formId, tenantId);
  if (!existing) throw new Error("FORM_NOT_FOUND");
  const row = await upsertFormRaw(tenantId, {
    id: existing.id,
    name: data.name ?? existing.name,
    slug: data.slug === undefined ? existing.slug : data.slug ?? null,
    description:
      data.description === undefined
        ? existing.description
        : data.description ?? null,
    status: (data.status as FormRow["status"]) ?? existing.status,
    is_public: data.isPublic === undefined ? existing.is_public : data.isPublic,
    submit_label:
      data.submitLabel === undefined
        ? existing.submit_label
        : data.submitLabel ?? null,
    success_message:
      data.successMessage === undefined
        ? existing.success_message
        : data.successMessage ?? null,
    success_redirect_url:
      data.successRedirectUrl === undefined
        ? existing.success_redirect_url
        : data.successRedirectUrl ?? null,
    settings: data.settings ?? existing.settings,
    created_at: existing.created_at,
    created_by: existing.created_by,
    updated_by: data.updatedBy ?? existing.updated_by,
  });
  return mapForm(row);
}

export async function deleteForm(
  formId: string,
  tenantId: string,
): Promise<void> {
  await deleteFormRaw(formId, tenantId);
}

export async function upsertFormField(
  formId: string,
  tenantId: string,
  data: FormFieldInput,
): Promise<FormField> {
  const row = await upsertFormFieldRaw(tenantId, {
    id: data.id,
    form_id: formId,
    section_id: data.sectionId ?? null,
    section_title: data.sectionTitle ?? null,
    field_key: data.fieldKey,
    label: data.label,
    field_type: data.fieldType,
    placeholder: data.placeholder ?? null,
    help_text: data.helpText ?? null,
    required: data.required === true,
    position: typeof data.position === "number" ? data.position : 0,
    options: (data.options ?? []) as unknown as Array<Record<string, unknown>>,
    validation_rules: (data.validationRules ?? []) as unknown as Array<
      Record<string, unknown>
    >,
    default_value: data.defaultValue ?? null,
    metadata: data.metadata ?? {},
  });
  return mapField(row);
}

export async function deleteFormField(
  fieldId: string,
  tenantId: string,
): Promise<void> {
  await deleteFormFieldRaw(fieldId, tenantId);
}

export interface CreateSubmissionInput {
  answers: FormSubmissionAnswer[];
  profileId?: string | null;
  submittedBy?: string | null;
  status?: FormSubmissionStatus;
  startedAt?: string | null;
  completedAt?: string | null;
  metadata?: Record<string, unknown>;
}

export async function createSubmission(
  formId: string,
  tenantId: string,
  data: CreateSubmissionInput,
): Promise<FormSubmission> {
  const startedAt = data.startedAt ?? new Date().toISOString();
  const completedAt =
    data.completedAt ?? (data.status === "completed" ? new Date().toISOString() : null);
  const durationMs =
    completedAt && startedAt
      ? Math.max(0, new Date(completedAt).getTime() - new Date(startedAt).getTime())
      : null;

  const row = await upsertFormSubmissionRaw(tenantId, {
    form_id: formId,
    status: data.status ?? "completed",
    submitted_by: data.submittedBy ?? data.profileId ?? null,
    profile_id: data.profileId ?? null,
    answers: (data.answers ?? []) as unknown as Array<Record<string, unknown>>,
    metadata: data.metadata ?? {},
    started_at: startedAt,
    completed_at: completedAt,
    duration_ms: durationMs,
  });
  return mapSubmission(row);
}
