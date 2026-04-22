import "server-only";
import { assertTenantAccess } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { logAudit } from "@/lib/audit/log";
// automation removed
import {
  createForm,
  createSubmission,
  deleteForm,
  deleteFormField,
  getForm,
  getFormWithFields,
  getPublicFormBySlug,
  getSubmission,
  listFormFields,
  listFormSubmissions,
  listForms,
  updateForm,
  upsertFormField,
  type CreateSubmissionInput,
} from "./queries";
import type {
  Form,
  FormDashboardData,
  FormField,
  FormFieldDropOff,
  FormFieldInput,
  FormInput,
  FormKpiSummary,
  FormSection,
  FormSubmission,
  FormSubmissionAnswer,
  FormSubmissionContext,
  FormSubmissionResult,
  FormSurface,
  FormValidationIssue,
  FormValidationResult,
} from "./types";

async function resolveTenantId(explicit?: string): Promise<string> {
  if (explicit && explicit.trim().length > 0) return explicit.trim();
  const session = await getSession();
  return session?.tenantId?.trim() || DEFAULT_TENANT_ID;
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

function isBlank(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export function validateAnswers(
  fields: FormField[],
  answers: FormSubmissionAnswer[],
): FormValidationResult {
  const issues: FormValidationIssue[] = [];
  const byFieldId = new Map<string, FormSubmissionAnswer>();
  const byFieldKey = new Map<string, FormSubmissionAnswer>();
  for (const a of answers) {
    if (a.fieldId) byFieldId.set(a.fieldId, a);
    if (a.fieldKey) byFieldKey.set(a.fieldKey, a);
  }

  for (const field of fields) {
    const answer =
      byFieldId.get(field.id) ?? byFieldKey.get(field.fieldKey) ?? null;
    const value = answer?.value;

    if (field.required && isBlank(value)) {
      issues.push({
        fieldId: field.id,
        fieldKey: field.fieldKey,
        message: `${field.label} is required.`,
      });
      continue;
    }

    if (isBlank(value)) continue;

    for (const rule of field.validationRules ?? []) {
      switch (rule.kind) {
        case "required":
          if (isBlank(value)) {
            issues.push({
              fieldId: field.id,
              fieldKey: field.fieldKey,
              message: rule.message ?? `${field.label} is required.`,
            });
          }
          break;
        case "minLength":
          if (
            typeof value === "string" &&
            typeof rule.value === "number" &&
            value.length < rule.value
          ) {
            issues.push({
              fieldId: field.id,
              fieldKey: field.fieldKey,
              message:
                rule.message ??
                `${field.label} must be at least ${rule.value} characters.`,
            });
          }
          break;
        case "maxLength":
          if (
            typeof value === "string" &&
            typeof rule.value === "number" &&
            value.length > rule.value
          ) {
            issues.push({
              fieldId: field.id,
              fieldKey: field.fieldKey,
              message:
                rule.message ??
                `${field.label} must be at most ${rule.value} characters.`,
            });
          }
          break;
        case "min":
          if (
            typeof rule.value === "number" &&
            typeof Number(value) === "number" &&
            Number(value) < rule.value
          ) {
            issues.push({
              fieldId: field.id,
              fieldKey: field.fieldKey,
              message: rule.message ?? `${field.label} must be ≥ ${rule.value}.`,
            });
          }
          break;
        case "max":
          if (
            typeof rule.value === "number" &&
            typeof Number(value) === "number" &&
            Number(value) > rule.value
          ) {
            issues.push({
              fieldId: field.id,
              fieldKey: field.fieldKey,
              message: rule.message ?? `${field.label} must be ≤ ${rule.value}.`,
            });
          }
          break;
        case "pattern":
          if (typeof rule.value === "string" && typeof value === "string") {
            try {
              const re = new RegExp(rule.value);
              if (!re.test(value)) {
                issues.push({
                  fieldId: field.id,
                  fieldKey: field.fieldKey,
                  message: rule.message ?? `${field.label} format is invalid.`,
                });
              }
            } catch {
              // Ignore invalid regex; skip rule.
            }
          }
          break;
        case "email":
          if (
            typeof value === "string" &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          ) {
            issues.push({
              fieldId: field.id,
              fieldKey: field.fieldKey,
              message: rule.message ?? `${field.label} must be a valid email.`,
            });
          }
          break;
        case "url":
          if (typeof value === "string") {
            try {
              new URL(value);
            } catch {
              issues.push({
                fieldId: field.id,
                fieldKey: field.fieldKey,
                message: rule.message ?? `${field.label} must be a valid URL.`,
              });
            }
          }
          break;
        case "equals":
          if (value !== rule.value) {
            issues.push({
              fieldId: field.id,
              fieldKey: field.fieldKey,
              message:
                rule.message ?? `${field.label} must equal ${String(rule.value)}.`,
            });
          }
          break;
        case "custom":
          break;
      }
    }

    if (field.fieldType === "email" && typeof value === "string") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        issues.push({
          fieldId: field.id,
          fieldKey: field.fieldKey,
          message: `${field.label} must be a valid email.`,
        });
      }
    }
  }

  return { valid: issues.length === 0, issues };
}

function computeFieldDropOff(
  fields: FormField[],
  submissions: FormSubmission[],
): FormFieldDropOff[] {
  const ordered = [...fields].sort((a, b) => a.position - b.position);
  const total = submissions.length;
  if (total === 0) {
    return ordered.map((f) => ({
      fieldId: f.id,
      fieldKey: f.fieldKey,
      label: f.label,
      answeredCount: 0,
      dropOffCount: 0,
      dropOffRate: 0,
    }));
  }
  return ordered.map((f) => {
    let answered = 0;
    for (const sub of submissions) {
      const match = sub.answers.find(
        (a) => a.fieldId === f.id || a.fieldKey === f.fieldKey,
      );
      if (match && !isBlank(match.value)) answered += 1;
    }
    const dropOff = total - answered;
    return {
      fieldId: f.id,
      fieldKey: f.fieldKey,
      label: f.label,
      answeredCount: answered,
      dropOffCount: dropOff,
      dropOffRate: total > 0 ? dropOff / total : 0,
    };
  });
}

function computeKpis(
  fields: FormField[],
  submissions: FormSubmission[],
): FormKpiSummary {
  const total = submissions.length;
  const completed = submissions.filter((s) => s.status === "completed").length;
  const abandoned = submissions.filter((s) => s.status === "abandoned").length;
  const completionRate = total > 0 ? completed / total : 0;
  const abandonmentRate = total > 0 ? abandoned / total : 0;

  const durations = submissions
    .map((s) => s.durationMs)
    .filter((d): d is number => typeof d === "number" && d > 0);
  const averageDurationMs =
    durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : null;

  return {
    totalSubmissions: total,
    completedSubmissions: completed,
    abandonedSubmissions: abandoned,
    completionRate,
    abandonmentRate,
    averageDurationMs,
    fieldDropOff: computeFieldDropOff(fields, submissions),
  };
}

export async function getFormsDashboard(
  tenantIdHint?: string,
): Promise<FormDashboardData> {
  const tenantId = await resolveTenantId(tenantIdHint);
  await assertTenantAccess(tenantId);

  const [forms, allSubmissions] = await Promise.all([
    listForms(tenantId, { includeArchived: true }),
    listFormSubmissions(tenantId),
  ]);

  const submissionsByForm: Record<string, number> = {};
  for (const s of allSubmissions) {
    submissionsByForm[s.formId] = (submissionsByForm[s.formId] ?? 0) + 1;
  }

  const completed = allSubmissions.filter(
    (s) => s.status === "completed",
  ).length;
  const completionRate =
    allSubmissions.length > 0 ? completed / allSubmissions.length : 0;

  return {
    forms,
    submissionsByForm,
    kpis: {
      totalForms: forms.length,
      publishedForms: forms.filter((f) => f.status === "published").length,
      draftForms: forms.filter((f) => f.status === "draft").length,
      totalSubmissions: allSubmissions.length,
      completionRate,
    },
    recentSubmissions: allSubmissions.slice(0, 20),
    generatedAt: new Date().toISOString(),
  };
}

export async function getFormSurface(
  formId: string,
  tenantIdHint?: string,
): Promise<FormSurface | null> {
  const tenantId = await resolveTenantId(tenantIdHint);
  const form = await getForm(formId, tenantId);
  if (!form) return null;
  await assertTenantAccess(form.tenantId);

  const [fields, submissions] = await Promise.all([
    listFormFields(form.id, form.tenantId),
    listFormSubmissions(form.tenantId, { formId: form.id }),
  ]);

  const sections = deriveSections(fields);
  const kpis = computeKpis(fields, submissions);

  return { form, fields, sections, submissions, kpis };
}

export async function createFormForTenant(
  data: FormInput,
  tenantIdHint?: string,
): Promise<Form> {
  const tenantId = await resolveTenantId(tenantIdHint);
  await assertTenantAccess(tenantId);
  return createForm(tenantId, data);
}

export async function updateFormForTenant(
  formId: string,
  data: Partial<FormInput>,
  tenantIdHint?: string,
): Promise<Form> {
  const tenantId = await resolveTenantId(tenantIdHint);
  const existing = await getForm(formId, tenantId);
  if (!existing) throw new Error("FORM_NOT_FOUND");
  await assertTenantAccess(existing.tenantId);
  return updateForm(formId, existing.tenantId, data);
}

export async function deleteFormForTenant(
  formId: string,
  tenantIdHint?: string,
): Promise<void> {
  const tenantId = await resolveTenantId(tenantIdHint);
  const existing = await getForm(formId, tenantId);
  if (!existing) return;
  await assertTenantAccess(existing.tenantId);
  await deleteForm(formId, existing.tenantId);
}

export async function upsertFieldForTenant(
  formId: string,
  field: FormFieldInput,
  tenantIdHint?: string,
): Promise<FormField> {
  const tenantId = await resolveTenantId(tenantIdHint);
  const form = await getForm(formId, tenantId);
  if (!form) throw new Error("FORM_NOT_FOUND");
  await assertTenantAccess(form.tenantId);
  return upsertFormField(formId, form.tenantId, field);
}

export async function deleteFieldForTenant(
  formId: string,
  fieldId: string,
  tenantIdHint?: string,
): Promise<void> {
  const tenantId = await resolveTenantId(tenantIdHint);
  const form = await getForm(formId, tenantId);
  if (!form) throw new Error("FORM_NOT_FOUND");
  await assertTenantAccess(form.tenantId);
  await deleteFormField(fieldId, form.tenantId);
}

export async function validateForm(
  formId: string,
  answers: FormSubmissionAnswer[],
  tenantIdHint?: string,
): Promise<FormValidationResult> {
  const tenantId = await resolveTenantId(tenantIdHint);
  const bundle = await getFormWithFields(formId, tenantId);
  if (!bundle) throw new Error("FORM_NOT_FOUND");
  return validateAnswers(bundle.fields, answers);
}

export interface SubmitFormOptions extends FormSubmissionContext {
  tenantId?: string;
  skipValidation?: boolean;
}

export async function submitForm(
  formId: string,
  answers: FormSubmissionAnswer[],
  context: SubmitFormOptions = {},
): Promise<FormSubmissionResult> {
  const tenantId = await resolveTenantId(context.tenantId);
  const form = await getForm(formId, tenantId);
  if (!form) throw new Error("FORM_NOT_FOUND");

  const isPublicSubmission = form.isPublic === true;
  if (!isPublicSubmission) {
    await assertTenantAccess(form.tenantId);
  }

  const fields = await listFormFields(form.id, form.tenantId);
  const validation = context.skipValidation
    ? { valid: true, issues: [] as FormValidationIssue[] }
    : validateAnswers(fields, answers);

  if (!validation.valid) {
    return {
      submission: {
        id: "",
        tenantId: form.tenantId,
        formId: form.id,
        status: "started",
        submittedBy: context.submittedBy ?? context.profileId ?? null,
        profileId: context.profileId ?? null,
        answers,
        metadata: context.metadata ?? {},
        startedAt: context.startedAt ?? new Date().toISOString(),
        completedAt: null,
        durationMs: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      validation,
      automationsDispatched: 0,
    };
  }

  const normalizedAnswers = answers.map((a) => {
    const field =
      fields.find((f) => f.id === a.fieldId) ??
      fields.find((f) => f.fieldKey === a.fieldKey);
    return {
      fieldId: field?.id ?? a.fieldId ?? "",
      fieldKey: field?.fieldKey ?? a.fieldKey ?? "",
      label: field?.label ?? a.label ?? a.fieldKey ?? "",
      value: a.value,
      answeredAt: a.answeredAt ?? new Date().toISOString(),
    } satisfies FormSubmissionAnswer;
  });

  const input: CreateSubmissionInput = {
    answers: normalizedAnswers,
    profileId: context.profileId ?? null,
    submittedBy: context.submittedBy ?? context.profileId ?? null,
    status: "completed",
    startedAt: context.startedAt ?? new Date().toISOString(),
    completedAt: new Date().toISOString(),
    metadata: context.metadata ?? {},
  };

  const submission = await createSubmission(form.id, form.tenantId, input);

  await logAudit("forms.submission.created", {
    tenantId: form.tenantId,
    formId: form.id,
    formName: form.name,
    submissionId: submission.id,
    profileId: submission.profileId,
    status: submission.status,
  });

  const automationsDispatched = 0; // automation removed — no-op until agents rebuilt

  return {
    submission,
    validation,
    automationsDispatched,
  };
}

export async function submitPublicFormBySlug(
  slug: string,
  tenantId: string,
  answers: FormSubmissionAnswer[],
  context: Omit<SubmitFormOptions, "tenantId"> = {},
): Promise<FormSubmissionResult> {
  const form = await getPublicFormBySlug(slug, tenantId);
  if (!form) throw new Error("FORM_NOT_FOUND");
  if (!form.isPublic) throw new Error("FORM_NOT_PUBLIC");
  return submitForm(form.id, answers, { ...context, tenantId: form.tenantId });
}

export async function getSubmissionForTenant(
  submissionId: string,
  tenantIdHint?: string,
): Promise<FormSubmission | null> {
  const tenantId = await resolveTenantId(tenantIdHint);
  const submission = await getSubmission(submissionId, tenantId);
  if (!submission) return null;
  await assertTenantAccess(submission.tenantId);
  return submission;
}

export async function listSubmissionsForTenant(
  filter?: { formId?: string; status?: string; profileId?: string },
  tenantIdHint?: string,
): Promise<FormSubmission[]> {
  const tenantId = await resolveTenantId(tenantIdHint);
  await assertTenantAccess(tenantId);
  return listFormSubmissions(tenantId, filter);
}
