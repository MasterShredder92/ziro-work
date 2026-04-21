import "server-only";
import { deleteForm as deleteFormRaw, deleteFormField as deleteFormFieldRaw, getForm as getFormRaw, getFormSubmission as getFormSubmissionRaw, getPublicFormBySlug as getPublicFormBySlugRaw, listFormFields as listFormFieldsRaw, listForms as listFormsRaw, listFormSubmissions as listFormSubmissionsRaw, upsertForm as upsertFormRaw, upsertFormField as upsertFormFieldRaw, upsertFormSubmission as upsertFormSubmissionRaw, } from "@data/forms";
function mapForm(row) {
    var _a, _b;
    return {
        id: row.id,
        tenantId: row.tenant_id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        status: (_a = row.status) !== null && _a !== void 0 ? _a : "draft",
        isPublic: row.is_public,
        submitLabel: row.submit_label,
        successMessage: row.success_message,
        successRedirectUrl: row.success_redirect_url,
        settings: (_b = row.settings) !== null && _b !== void 0 ? _b : {},
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: row.created_by,
        updatedBy: row.updated_by,
    };
}
function mapField(row) {
    var _a, _b, _c;
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
        options: ((_a = row.options) !== null && _a !== void 0 ? _a : []),
        validationRules: ((_b = row.validation_rules) !== null && _b !== void 0 ? _b : []),
        defaultValue: row.default_value,
        metadata: (_c = row.metadata) !== null && _c !== void 0 ? _c : {},
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
function mapSubmission(row) {
    var _a, _b, _c;
    return {
        id: row.id,
        tenantId: row.tenant_id,
        formId: row.form_id,
        status: (_a = row.status) !== null && _a !== void 0 ? _a : "completed",
        submittedBy: row.submitted_by,
        profileId: row.profile_id,
        answers: ((_b = row.answers) !== null && _b !== void 0 ? _b : []),
        metadata: (_c = row.metadata) !== null && _c !== void 0 ? _c : {},
        startedAt: row.started_at,
        completedAt: row.completed_at,
        durationMs: row.duration_ms,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
export async function listForms(tenantId, filter) {
    const rows = await listFormsRaw(tenantId, filter);
    return rows.map(mapForm);
}
export async function getForm(formId, tenantId) {
    const row = await getFormRaw(formId, tenantId);
    return row ? mapForm(row) : null;
}
export async function getPublicFormBySlug(slug, tenantId) {
    const row = await getPublicFormBySlugRaw(slug, tenantId);
    return row ? mapForm(row) : null;
}
export async function listFormFields(formId, tenantId) {
    const rows = await listFormFieldsRaw(formId, tenantId);
    return rows.map(mapField);
}
export async function listFormSubmissions(tenantId, filter) {
    const rows = await listFormSubmissionsRaw(tenantId, filter);
    return rows.map(mapSubmission);
}
export async function getSubmission(submissionId, tenantId) {
    const row = await getFormSubmissionRaw(submissionId, tenantId);
    return row ? mapSubmission(row) : null;
}
function deriveSections(fields) {
    var _a;
    const out = [];
    const seen = new Map();
    let order = 0;
    for (const field of fields) {
        if (!field.sectionId)
            continue;
        if (seen.has(field.sectionId))
            continue;
        const section = {
            id: field.sectionId,
            title: (_a = field.sectionTitle) !== null && _a !== void 0 ? _a : "Section",
            order: order++,
        };
        seen.set(field.sectionId, section);
        out.push(section);
    }
    return out;
}
export async function getFormWithFields(formId, tenantId) {
    const form = await getForm(formId, tenantId);
    if (!form)
        return null;
    const fields = await listFormFields(formId, tenantId);
    const sections = deriveSections(fields);
    return { form, fields, sections };
}
export async function createForm(tenantId, data) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const row = await upsertFormRaw(tenantId, {
        name: data.name,
        slug: (_a = data.slug) !== null && _a !== void 0 ? _a : null,
        description: (_b = data.description) !== null && _b !== void 0 ? _b : null,
        status: (_c = data.status) !== null && _c !== void 0 ? _c : "draft",
        is_public: data.isPublic === true,
        submit_label: (_d = data.submitLabel) !== null && _d !== void 0 ? _d : null,
        success_message: (_e = data.successMessage) !== null && _e !== void 0 ? _e : null,
        success_redirect_url: (_f = data.successRedirectUrl) !== null && _f !== void 0 ? _f : null,
        settings: (_g = data.settings) !== null && _g !== void 0 ? _g : {},
        created_by: (_h = data.createdBy) !== null && _h !== void 0 ? _h : null,
        updated_by: (_k = (_j = data.updatedBy) !== null && _j !== void 0 ? _j : data.createdBy) !== null && _k !== void 0 ? _k : null,
    });
    return mapForm(row);
}
export async function updateForm(formId, tenantId, data) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const existing = await getFormRaw(formId, tenantId);
    if (!existing)
        throw new Error("FORM_NOT_FOUND");
    const row = await upsertFormRaw(tenantId, {
        id: existing.id,
        name: (_a = data.name) !== null && _a !== void 0 ? _a : existing.name,
        slug: data.slug === undefined ? existing.slug : (_b = data.slug) !== null && _b !== void 0 ? _b : null,
        description: data.description === undefined
            ? existing.description
            : (_c = data.description) !== null && _c !== void 0 ? _c : null,
        status: (_d = data.status) !== null && _d !== void 0 ? _d : existing.status,
        is_public: data.isPublic === undefined ? existing.is_public : data.isPublic,
        submit_label: data.submitLabel === undefined
            ? existing.submit_label
            : (_e = data.submitLabel) !== null && _e !== void 0 ? _e : null,
        success_message: data.successMessage === undefined
            ? existing.success_message
            : (_f = data.successMessage) !== null && _f !== void 0 ? _f : null,
        success_redirect_url: data.successRedirectUrl === undefined
            ? existing.success_redirect_url
            : (_g = data.successRedirectUrl) !== null && _g !== void 0 ? _g : null,
        settings: (_h = data.settings) !== null && _h !== void 0 ? _h : existing.settings,
        created_at: existing.created_at,
        created_by: existing.created_by,
        updated_by: (_j = data.updatedBy) !== null && _j !== void 0 ? _j : existing.updated_by,
    });
    return mapForm(row);
}
export async function deleteForm(formId, tenantId) {
    await deleteFormRaw(formId, tenantId);
}
export async function upsertFormField(formId, tenantId, data) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const row = await upsertFormFieldRaw(tenantId, {
        id: data.id,
        form_id: formId,
        section_id: (_a = data.sectionId) !== null && _a !== void 0 ? _a : null,
        section_title: (_b = data.sectionTitle) !== null && _b !== void 0 ? _b : null,
        field_key: data.fieldKey,
        label: data.label,
        field_type: data.fieldType,
        placeholder: (_c = data.placeholder) !== null && _c !== void 0 ? _c : null,
        help_text: (_d = data.helpText) !== null && _d !== void 0 ? _d : null,
        required: data.required === true,
        position: typeof data.position === "number" ? data.position : 0,
        options: ((_e = data.options) !== null && _e !== void 0 ? _e : []),
        validation_rules: ((_f = data.validationRules) !== null && _f !== void 0 ? _f : []),
        default_value: (_g = data.defaultValue) !== null && _g !== void 0 ? _g : null,
        metadata: (_h = data.metadata) !== null && _h !== void 0 ? _h : {},
    });
    return mapField(row);
}
export async function deleteFormField(fieldId, tenantId) {
    await deleteFormFieldRaw(fieldId, tenantId);
}
export async function createSubmission(formId, tenantId, data) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const startedAt = (_a = data.startedAt) !== null && _a !== void 0 ? _a : new Date().toISOString();
    const completedAt = (_b = data.completedAt) !== null && _b !== void 0 ? _b : (data.status === "completed" ? new Date().toISOString() : null);
    const durationMs = completedAt && startedAt
        ? Math.max(0, new Date(completedAt).getTime() - new Date(startedAt).getTime())
        : null;
    const row = await upsertFormSubmissionRaw(tenantId, {
        form_id: formId,
        status: (_c = data.status) !== null && _c !== void 0 ? _c : "completed",
        submitted_by: (_e = (_d = data.submittedBy) !== null && _d !== void 0 ? _d : data.profileId) !== null && _e !== void 0 ? _e : null,
        profile_id: (_f = data.profileId) !== null && _f !== void 0 ? _f : null,
        answers: ((_g = data.answers) !== null && _g !== void 0 ? _g : []),
        metadata: (_h = data.metadata) !== null && _h !== void 0 ? _h : {},
        started_at: startedAt,
        completed_at: completedAt,
        duration_ms: durationMs,
    });
    return mapSubmission(row);
}
