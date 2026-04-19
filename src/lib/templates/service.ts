import "server-only";
import { assertTenantAccess } from "@/lib/auth/guards";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { getSession } from "@/lib/auth/session";
import {
  createTemplate,
  createTemplateVersion,
  deleteTemplate,
  getTemplate,
  getTemplateVersion,
  listTemplateVersions,
  listTemplates,
  restoreTemplateVersion,
  updateTemplate,
} from "./queries";
import { renderTemplate } from "./renderer";
import type {
  MergeField,
  RenderedTemplate,
  Template,
  TemplateContext,
  TemplateInput,
  TemplateSurface,
  TemplateVersion,
  TemplateVersionInput,
} from "./types";

async function resolveTenantId(explicit?: string): Promise<string> {
  if (explicit && explicit.trim().length > 0) return explicit.trim();
  const session = await getSession();
  return session?.tenantId?.trim() || DEFAULT_TENANT_ID;
}

const BUILT_IN_MERGE_FIELDS: MergeField[] = [
  {
    path: "student.firstName",
    label: "Student first name",
    description: "First (given) name of the student.",
    example: "Ava",
    group: "student",
  },
  {
    path: "student.lastName",
    label: "Student last name",
    description: "Last (family) name of the student.",
    example: "Nguyen",
    group: "student",
  },
  {
    path: "student.preferredName",
    label: "Student preferred name",
    description: "Preferred or nickname for the student.",
    example: "Avi",
    group: "student",
  },
  {
    path: "student.instrument",
    label: "Student instrument",
    description: "Primary instrument the student is studying.",
    example: "piano",
    group: "student",
  },
  {
    path: "family.lastName",
    label: "Family last name",
    description: "Family surname or household name.",
    example: "Nguyen",
    group: "family",
  },
  {
    path: "family.primaryContactName",
    label: "Family primary contact",
    description: "Primary contact person for the family.",
    example: "Minh Nguyen",
    group: "family",
  },
  {
    path: "family.primaryEmail",
    label: "Family primary email",
    description: "Primary email on file for the family.",
    example: "minh@example.com",
    group: "family",
  },
  {
    path: "teacher.fullName",
    label: "Teacher full name",
    description: "Teacher's full display name.",
    example: "Rachel Kim",
    group: "teacher",
  },
  {
    path: "teacher.firstName",
    label: "Teacher first name",
    description: "Teacher's first name.",
    example: "Rachel",
    group: "teacher",
  },
  {
    path: "lesson.date",
    label: "Lesson date",
    description: "Scheduled date of the lesson.",
    example: "2026-04-22",
    group: "lesson",
  },
  {
    path: "lesson.startTime",
    label: "Lesson start time",
    description: "Start time (HH:MM) of the lesson.",
    example: "16:00",
    group: "lesson",
  },
  {
    path: "lesson.room",
    label: "Lesson room",
    description: "Room or virtual location for the lesson.",
    example: "Studio B",
    group: "lesson",
  },
  {
    path: "tenant.name",
    label: "Tenant name",
    description: "Workspace or school name.",
    example: "Harmony Music Academy",
    group: "tenant",
  },
];

export async function listMergeFields(): Promise<MergeField[]> {
  return BUILT_IN_MERGE_FIELDS.slice();
}

export async function listTemplatesForTenant(
  tenantId?: string,
): Promise<Template[]> {
  const resolved = await resolveTenantId(tenantId);
  await assertTenantAccess(resolved);
  return listTemplates(resolved);
}

export async function getTemplateSurface(
  templateId: string,
  tenantIdHint?: string,
): Promise<TemplateSurface | null> {
  const tenantId = await resolveTenantId(tenantIdHint);
  const template = await getTemplate(templateId, tenantId);
  if (!template) return null;
  await assertTenantAccess(template.tenantId);

  const versions = await listTemplateVersions(template.id, template.tenantId);
  const currentVersion =
    versions.find((v) => v.isCurrent) ??
    versions.find((v) => v.version === template.currentVersion) ??
    versions[0] ??
    null;

  return {
    template,
    versions,
    currentVersion,
    mergeFields: BUILT_IN_MERGE_FIELDS.slice(),
  };
}

export async function createTemplateForTenant(
  data: TemplateInput,
  tenantIdHint?: string,
): Promise<Template> {
  const tenantId = await resolveTenantId(tenantIdHint);
  await assertTenantAccess(tenantId);
  return createTemplate(tenantId, data);
}

export async function updateTemplateForTenant(
  templateId: string,
  data: Partial<TemplateInput>,
  tenantIdHint?: string,
): Promise<Template> {
  const tenantId = await resolveTenantId(tenantIdHint);
  const existing = await getTemplate(templateId, tenantId);
  if (!existing) throw new Error("TEMPLATE_NOT_FOUND");
  await assertTenantAccess(existing.tenantId);
  return updateTemplate(templateId, existing.tenantId, data);
}

export async function createTemplateVersionForTenant(
  templateId: string,
  data: TemplateVersionInput,
  tenantIdHint?: string,
): Promise<TemplateVersion> {
  const tenantId = await resolveTenantId(tenantIdHint);
  const existing = await getTemplate(templateId, tenantId);
  if (!existing) throw new Error("TEMPLATE_NOT_FOUND");
  await assertTenantAccess(existing.tenantId);
  return createTemplateVersion(templateId, existing.tenantId, data);
}

export async function deleteTemplateForTenant(
  templateId: string,
  tenantIdHint?: string,
): Promise<void> {
  const tenantId = await resolveTenantId(tenantIdHint);
  const existing = await getTemplate(templateId, tenantId);
  if (!existing) return;
  await assertTenantAccess(existing.tenantId);
  await deleteTemplate(templateId, existing.tenantId);
}

export interface RenderForContextInput {
  templateId: string;
  versionId?: string;
  context: TemplateContext;
  tenantId?: string;
}

export async function renderTemplateForContext(
  input: RenderForContextInput,
): Promise<RenderedTemplate> {
  const tenantId = await resolveTenantId(input.tenantId);
  const template = await getTemplate(input.templateId, tenantId);
  if (!template) throw new Error("TEMPLATE_NOT_FOUND");
  await assertTenantAccess(template.tenantId);

  let subject: string | null = template.subject;
  let body: string = template.body;
  let versionNumber = template.currentVersion;

  if (input.versionId) {
    const versions = await listTemplateVersions(template.id, template.tenantId);
    const target = versions.find((v) => v.id === input.versionId);
    if (!target) throw new Error("TEMPLATE_VERSION_NOT_FOUND");
    subject = target.subject;
    body = target.body;
    versionNumber = target.version;
  }

  return renderTemplate(body, input.context, {
    templateId: template.id,
    version: versionNumber,
    subject,
  });
}

export async function getTemplateVersionForTenant(
  templateId: string,
  versionId: string,
  tenantIdHint?: string,
): Promise<TemplateVersion | null> {
  const tenantId = await resolveTenantId(tenantIdHint);
  const template = await getTemplate(templateId, tenantId);
  if (!template) throw new Error("TEMPLATE_NOT_FOUND");
  await assertTenantAccess(template.tenantId);
  const version = await getTemplateVersion(versionId, template.tenantId);
  if (!version || version.templateId !== template.id) return null;
  return version;
}

export async function restoreTemplateVersionForTenant(
  templateId: string,
  versionId: string,
  tenantIdHint?: string,
  options: { changeSummary?: string | null } = {},
): Promise<{ version: TemplateVersion; surface: TemplateSurface }> {
  const tenantId = await resolveTenantId(tenantIdHint);
  const template = await getTemplate(templateId, tenantId);
  if (!template) throw new Error("TEMPLATE_NOT_FOUND");
  await assertTenantAccess(template.tenantId);

  const session = await getSession();
  const version = await restoreTemplateVersion(
    template.id,
    versionId,
    template.tenantId,
    {
      changeSummary: options.changeSummary ?? null,
      createdBy: session?.userId ?? null,
    },
  );
  const surface = await getTemplateSurface(template.id, template.tenantId);
  if (!surface) throw new Error("TEMPLATE_NOT_FOUND");
  return { version, surface };
}

export interface SendTestMessageInput {
  templateId: string;
  versionId?: string;
  targetProfileId: string;
  context?: TemplateContext;
  tenantId?: string;
  subjectOverride?: string | null;
}

export interface SendTestMessageResult {
  templateId: string;
  version: number;
  rendered: RenderedTemplate;
  delivery: {
    channel: string;
    targetProfileId: string;
    threadId: string | null;
    messageId: string | null;
    simulated: boolean;
    error?: string;
  };
  sentAt: string;
}

export async function sendTestMessage(
  input: SendTestMessageInput,
): Promise<SendTestMessageResult> {
  const tenantId = await resolveTenantId(input.tenantId);
  const template = await getTemplate(input.templateId, tenantId);
  if (!template) throw new Error("TEMPLATE_NOT_FOUND");
  await assertTenantAccess(template.tenantId);

  const session = await getSession();
  const senderProfileId = session?.userId ?? "";

  const context = (input.context ?? {}) as TemplateContext;
  const rendered = await renderTemplateForContext({
    templateId: template.id,
    versionId: input.versionId,
    context,
    tenantId: template.tenantId,
  });

  const body = input.subjectOverride
    ? `${input.subjectOverride}\n\n${rendered.body}`
    : rendered.subject
      ? `${rendered.subject}\n\n${rendered.body}`
      : rendered.body;

  let threadId: string | null = null;
  let messageId: string | null = null;
  let simulated = false;
  let error: string | undefined;

  try {
    if (!senderProfileId || !input.targetProfileId) {
      simulated = true;
    } else {
      const { sendMessage } = await import("./../messaging/queries");
      const { thread, message } = await sendMessage(
        senderProfileId,
        input.targetProfileId,
        body,
      );
      threadId = thread.id;
      messageId = message.id;
    }
  } catch (err) {
    simulated = true;
    error = err instanceof Error ? err.message : "SEND_FAILED";
  }

  return {
    templateId: template.id,
    version: rendered.version,
    rendered,
    delivery: {
      channel: template.channel,
      targetProfileId: input.targetProfileId,
      threadId,
      messageId,
      simulated,
      ...(error ? { error } : {}),
    },
    sentAt: new Date().toISOString(),
  };
}
