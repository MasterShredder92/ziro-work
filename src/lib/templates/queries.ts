import "server-only";
import {
  deleteTemplate as deleteTemplateRaw,
  getTemplate as getTemplateRaw,
  getTemplateVersion as getTemplateVersionRaw,
  listTemplates as listTemplatesRaw,
  listTemplateVersions as listTemplateVersionsRaw,
  markVersionCurrent,
  upsertTemplate as upsertTemplateRaw,
  upsertTemplateVersion as upsertTemplateVersionRaw,
  type TemplateFilter,
  type TemplateRow,
  type TemplateVersionRow,
} from "@data/templates";
import type {
  Template,
  TemplateInput,
  TemplateVersion,
  TemplateVersionInput,
} from "./types";

function mapTemplate(row: TemplateRow): Template {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    category: row.category,
    channel: row.channel,
    subject: row.subject,
    body: row.body,
    currentVersion: row.current_version,
    isArchived: row.is_archived,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

function mapVersion(row: TemplateVersionRow): TemplateVersion {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    templateId: row.template_id,
    version: row.version,
    subject: row.subject,
    body: row.body,
    changeSummary: row.change_summary,
    isCurrent: row.is_current,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

export async function listTemplates(
  tenantId: string,
  filter?: TemplateFilter,
): Promise<Template[]> {
  const rows = await listTemplatesRaw(tenantId, filter);
  return rows.map(mapTemplate);
}

export async function getTemplate(
  templateId: string,
  tenantId: string,
): Promise<Template | null> {
  const row = await getTemplateRaw(templateId, tenantId);
  return row ? mapTemplate(row) : null;
}

export async function listTemplateVersions(
  templateId: string,
  tenantId: string,
): Promise<TemplateVersion[]> {
  const rows = await listTemplateVersionsRaw(templateId, tenantId);
  return rows.map(mapVersion);
}

export async function createTemplate(
  tenantId: string,
  data: TemplateInput,
): Promise<Template> {
  const row = await upsertTemplateRaw(tenantId, {
    name: data.name,
    slug: data.slug ?? null,
    description: data.description ?? null,
    category: data.category ?? "general",
    channel: data.channel ?? "email",
    subject: data.subject ?? null,
    body: data.body,
    current_version: 1,
    is_archived: data.isArchived === true,
    created_by: data.createdBy ?? null,
    updated_by: data.updatedBy ?? data.createdBy ?? null,
  });

  const version = await upsertTemplateVersionRaw(tenantId, {
    template_id: row.id,
    version: 1,
    subject: row.subject,
    body: row.body,
    change_summary: "Initial version",
    is_current: true,
    created_by: data.createdBy ?? null,
  });
  await markVersionCurrent(row.id, version.id, tenantId);

  return mapTemplate(row);
}

export async function updateTemplate(
  templateId: string,
  tenantId: string,
  data: Partial<TemplateInput>,
): Promise<Template> {
  const existing = await getTemplateRaw(templateId, tenantId);
  if (!existing) {
    throw new Error("TEMPLATE_NOT_FOUND");
  }

  const nextRow = await upsertTemplateRaw(tenantId, {
    id: existing.id,
    name: data.name ?? existing.name,
    slug: data.slug === undefined ? existing.slug : data.slug ?? null,
    description:
      data.description === undefined
        ? existing.description
        : data.description ?? null,
    category: data.category ?? existing.category,
    channel: data.channel ?? existing.channel,
    subject: data.subject === undefined ? existing.subject : data.subject ?? null,
    body: data.body ?? existing.body,
    current_version: existing.current_version,
    is_archived:
      data.isArchived === undefined ? existing.is_archived : data.isArchived,
    created_at: existing.created_at,
    created_by: existing.created_by,
    updated_by: data.updatedBy ?? existing.updated_by,
  });

  return mapTemplate(nextRow);
}

export async function createTemplateVersion(
  templateId: string,
  tenantId: string,
  data: TemplateVersionInput,
): Promise<TemplateVersion> {
  const existing = await getTemplateRaw(templateId, tenantId);
  if (!existing) {
    throw new Error("TEMPLATE_NOT_FOUND");
  }

  const priorVersions = await listTemplateVersionsRaw(templateId, tenantId);
  const maxVersion = priorVersions.reduce(
    (acc, v) => (v.version > acc ? v.version : acc),
    existing.current_version,
  );
  const nextVersion = data.version ?? maxVersion + 1;

  const version = await upsertTemplateVersionRaw(tenantId, {
    template_id: templateId,
    version: nextVersion,
    subject: data.subject ?? existing.subject,
    body: data.body,
    change_summary: data.changeSummary ?? null,
    is_current: data.isCurrent === true,
    created_by: data.createdBy ?? null,
  });

  if (data.isCurrent === true) {
    await markVersionCurrent(templateId, version.id, tenantId);
    await upsertTemplateRaw(tenantId, {
      id: existing.id,
      name: existing.name,
      slug: existing.slug,
      description: existing.description,
      category: existing.category,
      channel: existing.channel,
      subject: version.subject,
      body: version.body,
      current_version: nextVersion,
      is_archived: existing.is_archived,
      created_at: existing.created_at,
      created_by: existing.created_by,
      updated_by: data.createdBy ?? existing.updated_by,
    });
  }

  return mapVersion(version);
}

export async function deleteTemplate(
  templateId: string,
  tenantId: string,
): Promise<void> {
  await deleteTemplateRaw(templateId, tenantId);
}

export async function getTemplateVersion(
  versionId: string,
  tenantId: string,
): Promise<TemplateVersion | null> {
  const row = await getTemplateVersionRaw(versionId, tenantId);
  return row ? mapVersion(row) : null;
}

export async function restoreTemplateVersion(
  templateId: string,
  versionId: string,
  tenantId: string,
  options: { changeSummary?: string | null; createdBy?: string | null } = {},
): Promise<TemplateVersion> {
  const existing = await getTemplateRaw(templateId, tenantId);
  if (!existing) throw new Error("TEMPLATE_NOT_FOUND");

  const target = await getTemplateVersionRaw(versionId, tenantId);
  if (!target || target.template_id !== templateId) {
    throw new Error("TEMPLATE_VERSION_NOT_FOUND");
  }

  const priorVersions = await listTemplateVersionsRaw(templateId, tenantId);
  const maxVersion = priorVersions.reduce(
    (acc, v) => (v.version > acc ? v.version : acc),
    existing.current_version,
  );
  const nextVersionNumber = maxVersion + 1;

  const restored = await upsertTemplateVersionRaw(tenantId, {
    template_id: templateId,
    version: nextVersionNumber,
    subject: target.subject,
    body: target.body,
    change_summary:
      options.changeSummary ?? `Restored from v${target.version}`,
    is_current: true,
    created_by: options.createdBy ?? null,
  });

  await markVersionCurrent(templateId, restored.id, tenantId);
  await upsertTemplateRaw(tenantId, {
    id: existing.id,
    name: existing.name,
    slug: existing.slug,
    description: existing.description,
    category: existing.category,
    channel: existing.channel,
    subject: target.subject,
    body: target.body,
    current_version: nextVersionNumber,
    is_archived: existing.is_archived,
    created_at: existing.created_at,
    created_by: existing.created_by,
    updated_by: options.createdBy ?? existing.updated_by,
  });

  return mapVersion(restored);
}
