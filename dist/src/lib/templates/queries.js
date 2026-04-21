import "server-only";
import { deleteTemplate as deleteTemplateRaw, getTemplate as getTemplateRaw, getTemplateVersion as getTemplateVersionRaw, listTemplates as listTemplatesRaw, listTemplateVersions as listTemplateVersionsRaw, markVersionCurrent, upsertTemplate as upsertTemplateRaw, upsertTemplateVersion as upsertTemplateVersionRaw, } from "@data/templates";
function mapTemplate(row) {
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
function mapVersion(row) {
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
export async function listTemplates(tenantId, filter) {
    const rows = await listTemplatesRaw(tenantId, filter);
    return rows.map(mapTemplate);
}
export async function getTemplate(templateId, tenantId) {
    const row = await getTemplateRaw(templateId, tenantId);
    return row ? mapTemplate(row) : null;
}
export async function listTemplateVersions(templateId, tenantId) {
    const rows = await listTemplateVersionsRaw(templateId, tenantId);
    return rows.map(mapVersion);
}
export async function createTemplate(tenantId, data) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const row = await upsertTemplateRaw(tenantId, {
        name: data.name,
        slug: (_a = data.slug) !== null && _a !== void 0 ? _a : null,
        description: (_b = data.description) !== null && _b !== void 0 ? _b : null,
        category: (_c = data.category) !== null && _c !== void 0 ? _c : "general",
        channel: (_d = data.channel) !== null && _d !== void 0 ? _d : "email",
        subject: (_e = data.subject) !== null && _e !== void 0 ? _e : null,
        body: data.body,
        current_version: 1,
        is_archived: data.isArchived === true,
        created_by: (_f = data.createdBy) !== null && _f !== void 0 ? _f : null,
        updated_by: (_h = (_g = data.updatedBy) !== null && _g !== void 0 ? _g : data.createdBy) !== null && _h !== void 0 ? _h : null,
    });
    const version = await upsertTemplateVersionRaw(tenantId, {
        template_id: row.id,
        version: 1,
        subject: row.subject,
        body: row.body,
        change_summary: "Initial version",
        is_current: true,
        created_by: (_j = data.createdBy) !== null && _j !== void 0 ? _j : null,
    });
    await markVersionCurrent(row.id, version.id, tenantId);
    return mapTemplate(row);
}
export async function updateTemplate(templateId, tenantId, data) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const existing = await getTemplateRaw(templateId, tenantId);
    if (!existing) {
        throw new Error("TEMPLATE_NOT_FOUND");
    }
    const nextRow = await upsertTemplateRaw(tenantId, {
        id: existing.id,
        name: (_a = data.name) !== null && _a !== void 0 ? _a : existing.name,
        slug: data.slug === undefined ? existing.slug : (_b = data.slug) !== null && _b !== void 0 ? _b : null,
        description: data.description === undefined
            ? existing.description
            : (_c = data.description) !== null && _c !== void 0 ? _c : null,
        category: (_d = data.category) !== null && _d !== void 0 ? _d : existing.category,
        channel: (_e = data.channel) !== null && _e !== void 0 ? _e : existing.channel,
        subject: data.subject === undefined ? existing.subject : (_f = data.subject) !== null && _f !== void 0 ? _f : null,
        body: (_g = data.body) !== null && _g !== void 0 ? _g : existing.body,
        current_version: existing.current_version,
        is_archived: data.isArchived === undefined ? existing.is_archived : data.isArchived,
        created_at: existing.created_at,
        created_by: existing.created_by,
        updated_by: (_h = data.updatedBy) !== null && _h !== void 0 ? _h : existing.updated_by,
    });
    return mapTemplate(nextRow);
}
export async function createTemplateVersion(templateId, tenantId, data) {
    var _a, _b, _c, _d, _e;
    const existing = await getTemplateRaw(templateId, tenantId);
    if (!existing) {
        throw new Error("TEMPLATE_NOT_FOUND");
    }
    const priorVersions = await listTemplateVersionsRaw(templateId, tenantId);
    const maxVersion = priorVersions.reduce((acc, v) => (v.version > acc ? v.version : acc), existing.current_version);
    const nextVersion = (_a = data.version) !== null && _a !== void 0 ? _a : maxVersion + 1;
    const version = await upsertTemplateVersionRaw(tenantId, {
        template_id: templateId,
        version: nextVersion,
        subject: (_b = data.subject) !== null && _b !== void 0 ? _b : existing.subject,
        body: data.body,
        change_summary: (_c = data.changeSummary) !== null && _c !== void 0 ? _c : null,
        is_current: data.isCurrent === true,
        created_by: (_d = data.createdBy) !== null && _d !== void 0 ? _d : null,
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
            updated_by: (_e = data.createdBy) !== null && _e !== void 0 ? _e : existing.updated_by,
        });
    }
    return mapVersion(version);
}
export async function deleteTemplate(templateId, tenantId) {
    await deleteTemplateRaw(templateId, tenantId);
}
export async function getTemplateVersion(versionId, tenantId) {
    const row = await getTemplateVersionRaw(versionId, tenantId);
    return row ? mapVersion(row) : null;
}
export async function restoreTemplateVersion(templateId, versionId, tenantId, options = {}) {
    var _a, _b, _c;
    const existing = await getTemplateRaw(templateId, tenantId);
    if (!existing)
        throw new Error("TEMPLATE_NOT_FOUND");
    const target = await getTemplateVersionRaw(versionId, tenantId);
    if (!target || target.template_id !== templateId) {
        throw new Error("TEMPLATE_VERSION_NOT_FOUND");
    }
    const priorVersions = await listTemplateVersionsRaw(templateId, tenantId);
    const maxVersion = priorVersions.reduce((acc, v) => (v.version > acc ? v.version : acc), existing.current_version);
    const nextVersionNumber = maxVersion + 1;
    const restored = await upsertTemplateVersionRaw(tenantId, {
        template_id: templateId,
        version: nextVersionNumber,
        subject: target.subject,
        body: target.body,
        change_summary: (_a = options.changeSummary) !== null && _a !== void 0 ? _a : `Restored from v${target.version}`,
        is_current: true,
        created_by: (_b = options.createdBy) !== null && _b !== void 0 ? _b : null,
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
        updated_by: (_c = options.createdBy) !== null && _c !== void 0 ? _c : existing.updated_by,
    });
    return mapVersion(restored);
}
