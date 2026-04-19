export const FORM_STATUSES = ["draft", "published", "archived"] as const;
export type FormStatus = (typeof FORM_STATUSES)[number];

export const FIELD_TYPES = [
  "text",
  "textarea",
  "email",
  "phone",
  "number",
  "date",
  "datetime",
  "select",
  "multiselect",
  "radio",
  "checkbox",
  "boolean",
  "rating",
  "url",
  "hidden",
] as const;
export type FormFieldType = (typeof FIELD_TYPES)[number] | string;

export const SUBMISSION_STATUSES = [
  "started",
  "completed",
  "abandoned",
] as const;
export type FormSubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export interface FormFieldOption {
  value: string;
  label: string;
  description?: string | null;
}

export interface FormValidationRule {
  kind:
    | "required"
    | "min"
    | "max"
    | "minLength"
    | "maxLength"
    | "pattern"
    | "email"
    | "url"
    | "equals"
    | "custom";
  value?: string | number | null;
  message?: string | null;
}

export interface FormSection {
  id: string;
  title: string;
  description?: string | null;
  order: number;
}

export interface FormField {
  id: string;
  tenantId: string;
  formId: string;
  sectionId: string | null;
  sectionTitle: string | null;
  fieldKey: string;
  label: string;
  fieldType: FormFieldType;
  placeholder: string | null;
  helpText: string | null;
  required: boolean;
  position: number;
  options: FormFieldOption[];
  validationRules: FormValidationRule[];
  defaultValue: unknown;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Form {
  id: string;
  tenantId: string;
  name: string;
  slug: string | null;
  description: string | null;
  status: FormStatus;
  isPublic: boolean;
  submitLabel: string | null;
  successMessage: string | null;
  successRedirectUrl: string | null;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface FormSubmissionAnswer {
  fieldId: string;
  fieldKey: string;
  label: string;
  value: unknown;
  answeredAt?: string;
}

export interface FormSubmission {
  id: string;
  tenantId: string;
  formId: string;
  status: FormSubmissionStatus;
  submittedBy: string | null;
  profileId: string | null;
  answers: FormSubmissionAnswer[];
  metadata: Record<string, unknown>;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface FormInput {
  name: string;
  slug?: string | null;
  description?: string | null;
  status?: FormStatus;
  isPublic?: boolean;
  submitLabel?: string | null;
  successMessage?: string | null;
  successRedirectUrl?: string | null;
  settings?: Record<string, unknown>;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface FormFieldInput {
  id?: string;
  sectionId?: string | null;
  sectionTitle?: string | null;
  fieldKey: string;
  label: string;
  fieldType: FormFieldType;
  placeholder?: string | null;
  helpText?: string | null;
  required?: boolean;
  position?: number;
  options?: FormFieldOption[];
  validationRules?: FormValidationRule[];
  defaultValue?: unknown;
  metadata?: Record<string, unknown>;
}

export interface FormWithFields {
  form: Form;
  fields: FormField[];
  sections: FormSection[];
}

export interface FormKpiSummary {
  totalSubmissions: number;
  completedSubmissions: number;
  abandonedSubmissions: number;
  completionRate: number;
  abandonmentRate: number;
  averageDurationMs: number | null;
  fieldDropOff: FormFieldDropOff[];
}

export interface FormFieldDropOff {
  fieldId: string;
  fieldKey: string;
  label: string;
  answeredCount: number;
  dropOffCount: number;
  dropOffRate: number;
}

export interface FormDashboardData {
  forms: Form[];
  submissionsByForm: Record<string, number>;
  kpis: {
    totalForms: number;
    publishedForms: number;
    draftForms: number;
    totalSubmissions: number;
    completionRate: number;
  };
  recentSubmissions: FormSubmission[];
  generatedAt: string;
}

export interface FormSurface {
  form: Form;
  fields: FormField[];
  sections: FormSection[];
  submissions: FormSubmission[];
  kpis: FormKpiSummary;
}

export interface FormSubmissionContext {
  profileId?: string | null;
  submittedBy?: string | null;
  startedAt?: string | null;
  metadata?: Record<string, unknown>;
  locationId?: string | null;
}

export interface FormValidationIssue {
  fieldId: string;
  fieldKey: string;
  message: string;
}

export interface FormValidationResult {
  valid: boolean;
  issues: FormValidationIssue[];
}

export interface FormSubmissionResult {
  submission: FormSubmission;
  validation: FormValidationResult;
  automationsDispatched: number;
}
