export const TEMPLATE_CATEGORIES = [
  "general",
  "enrollment",
  "billing",
  "lesson",
  "reminder",
  "announcement",
  "marketing",
  "followup",
] as const;

export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

export const TEMPLATE_CHANNELS = ["email", "sms", "chat", "in_app"] as const;

export type TemplateChannel = (typeof TEMPLATE_CHANNELS)[number];

export interface Template {
  id: string;
  tenantId: string;
  name: string;
  slug: string | null;
  description: string | null;
  category: TemplateCategory | string;
  channel: TemplateChannel | string;
  subject: string | null;
  body: string;
  currentVersion: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface TemplateVersion {
  id: string;
  tenantId: string;
  templateId: string;
  version: number;
  subject: string | null;
  body: string;
  changeSummary: string | null;
  isCurrent: boolean;
  createdAt: string;
  createdBy: string | null;
}

export interface TemplateInput {
  name: string;
  slug?: string | null;
  description?: string | null;
  category?: TemplateCategory | string;
  channel?: TemplateChannel | string;
  subject?: string | null;
  body: string;
  isArchived?: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface TemplateVersionInput {
  version?: number;
  subject?: string | null;
  body: string;
  changeSummary?: string | null;
  isCurrent?: boolean;
  createdBy?: string | null;
}

export interface MergeField {
  path: string;
  label: string;
  description: string;
  example: string;
  group: "student" | "family" | "teacher" | "lesson" | "tenant" | "custom";
}

export interface RenderedTemplate {
  templateId: string;
  version: number;
  subject: string | null;
  body: string;
  missingMergeFields: string[];
  renderedAt: string;
}

export interface TemplateContextStudent {
  id?: string;
  firstName?: string | null;
  lastName?: string | null;
  preferredName?: string | null;
  instrument?: string | null;
  email?: string | null;
  [key: string]: unknown;
}

export interface TemplateContextFamily {
  id?: string;
  name?: string | null;
  lastName?: string | null;
  primaryContactName?: string | null;
  primaryEmail?: string | null;
  [key: string]: unknown;
}

export interface TemplateContextTeacher {
  id?: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  email?: string | null;
  [key: string]: unknown;
}

export interface TemplateContextLesson {
  id?: string;
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  room?: string | null;
  isVirtual?: boolean | null;
  [key: string]: unknown;
}

export interface TemplateContextTenant {
  id?: string;
  name?: string | null;
  [key: string]: unknown;
}

export interface TemplateContext {
  student?: TemplateContextStudent | null;
  family?: TemplateContextFamily | null;
  teacher?: TemplateContextTeacher | null;
  lesson?: TemplateContextLesson | null;
  tenant?: TemplateContextTenant | null;
  lessons?: TemplateContextLesson[] | null;
  custom?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface TemplateSurface {
  template: Template;
  versions: TemplateVersion[];
  currentVersion: TemplateVersion | null;
  mergeFields: MergeField[];
}
