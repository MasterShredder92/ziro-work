import "server-only";
import { assertTenantAccess } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { logAudit } from "@/lib/audit/log";
import { dispatchAutomationEvent } from "@/lib/automation/engine";
import { createForm, createSubmission, deleteForm, deleteFormField, getForm, getFormWithFields, getPublicFormBySlug, getSubmission, listFormFields, listFormSubmissions, listForms, updateForm, upsertFormField, } from "./queries";
async function resolveTenantId(explicit) {
    var _a;
    if (explicit && explicit.trim().length > 0)
        return explicit.trim();
    const session = await getSession();
    return ((_a = session === null || session === void 0 ? void 0 : session.tenantId) === null || _a === void 0 ? void 0 : _a.trim()) || DEFAULT_TENANT_ID;
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
function isBlank(value) {
    if (value === null || value === undefined)
        return true;
    if (typeof value === "string")
        return value.trim().length === 0;
    if (Array.isArray(value))
        return value.length === 0;
    return false;
}
export function validateAnswers(fields, answers) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const issues = [];
    const byFieldId = new Map();
    const byFieldKey = new Map();
    for (const a of answers) {
        if (a.fieldId)
            byFieldId.set(a.fieldId, a);
        if (a.fieldKey)
            byFieldKey.set(a.fieldKey, a);
    }
    for (const field of fields) {
        const answer = (_b = (_a = byFieldId.get(field.id)) !== null && _a !== void 0 ? _a : byFieldKey.get(field.fieldKey)) !== null && _b !== void 0 ? _b : null;
        const value = answer === null || answer === void 0 ? void 0 : answer.value;
        if (field.required && isBlank(value)) {
            issues.push({
                fieldId: field.id,
                fieldKey: field.fieldKey,
                message: `${field.label} is required.`,
            });
            continue;
        }
        if (isBlank(value))
            continue;
        for (const rule of (_c = field.validationRules) !== null && _c !== void 0 ? _c : []) {
            switch (rule.kind) {
                case "required":
                    if (isBlank(value)) {
                        issues.push({
                            fieldId: field.id,
                            fieldKey: field.fieldKey,
                            message: (_d = rule.message) !== null && _d !== void 0 ? _d : `${field.label} is required.`,
                        });
                    }
                    break;
                case "minLength":
                    if (typeof value === "string" &&
                        typeof rule.value === "number" &&
                        value.length < rule.value) {
                        issues.push({
                            fieldId: field.id,
                            fieldKey: field.fieldKey,
                            message: (_e = rule.message) !== null && _e !== void 0 ? _e : `${field.label} must be at least ${rule.value} characters.`,
                        });
                    }
                    break;
                case "maxLength":
                    if (typeof value === "string" &&
                        typeof rule.value === "number" &&
                        value.length > rule.value) {
                        issues.push({
                            fieldId: field.id,
                            fieldKey: field.fieldKey,
                            message: (_f = rule.message) !== null && _f !== void 0 ? _f : `${field.label} must be at most ${rule.value} characters.`,
                        });
                    }
                    break;
                case "min":
                    if (typeof rule.value === "number" &&
                        typeof Number(value) === "number" &&
                        Number(value) < rule.value) {
                        issues.push({
                            fieldId: field.id,
                            fieldKey: field.fieldKey,
                            message: (_g = rule.message) !== null && _g !== void 0 ? _g : `${field.label} must be ≥ ${rule.value}.`,
                        });
                    }
                    break;
                case "max":
                    if (typeof rule.value === "number" &&
                        typeof Number(value) === "number" &&
                        Number(value) > rule.value) {
                        issues.push({
                            fieldId: field.id,
                            fieldKey: field.fieldKey,
                            message: (_h = rule.message) !== null && _h !== void 0 ? _h : `${field.label} must be ≤ ${rule.value}.`,
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
                                    message: (_j = rule.message) !== null && _j !== void 0 ? _j : `${field.label} format is invalid.`,
                                });
                            }
                        }
                        catch (_o) {
                            // Ignore invalid regex; skip rule.
                        }
                    }
                    break;
                case "email":
                    if (typeof value === "string" &&
                        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                        issues.push({
                            fieldId: field.id,
                            fieldKey: field.fieldKey,
                            message: (_k = rule.message) !== null && _k !== void 0 ? _k : `${field.label} must be a valid email.`,
                        });
                    }
                    break;
                case "url":
                    if (typeof value === "string") {
                        try {
                            new URL(value);
                        }
                        catch (_p) {
                            issues.push({
                                fieldId: field.id,
                                fieldKey: field.fieldKey,
                                message: (_l = rule.message) !== null && _l !== void 0 ? _l : `${field.label} must be a valid URL.`,
                            });
                        }
                    }
                    break;
                case "equals":
                    if (value !== rule.value) {
                        issues.push({
                            fieldId: field.id,
                            fieldKey: field.fieldKey,
                            message: (_m = rule.message) !== null && _m !== void 0 ? _m : `${field.label} must equal ${String(rule.value)}.`,
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
function computeFieldDropOff(fields, submissions) {
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
            const match = sub.answers.find((a) => a.fieldId === f.id || a.fieldKey === f.fieldKey);
            if (match && !isBlank(match.value))
                answered += 1;
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
function computeKpis(fields, submissions) {
    const total = submissions.length;
    const completed = submissions.filter((s) => s.status === "completed").length;
    const abandoned = submissions.filter((s) => s.status === "abandoned").length;
    const completionRate = total > 0 ? completed / total : 0;
    const abandonmentRate = total > 0 ? abandoned / total : 0;
    const durations = submissions
        .map((s) => s.durationMs)
        .filter((d) => typeof d === "number" && d > 0);
    const averageDurationMs = durations.length > 0
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
export async function getFormsDashboard(tenantIdHint) {
    var _a;
    const tenantId = await resolveTenantId(tenantIdHint);
    await assertTenantAccess(tenantId);
    const [forms, allSubmissions] = await Promise.all([
        listForms(tenantId, { includeArchived: true }),
        listFormSubmissions(tenantId),
    ]);
    const submissionsByForm = {};
    for (const s of allSubmissions) {
        submissionsByForm[s.formId] = ((_a = submissionsByForm[s.formId]) !== null && _a !== void 0 ? _a : 0) + 1;
    }
    const completed = allSubmissions.filter((s) => s.status === "completed").length;
    const completionRate = allSubmissions.length > 0 ? completed / allSubmissions.length : 0;
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
export async function getFormSurface(formId, tenantIdHint) {
    const tenantId = await resolveTenantId(tenantIdHint);
    const form = await getForm(formId, tenantId);
    if (!form)
        return null;
    await assertTenantAccess(form.tenantId);
    const [fields, submissions] = await Promise.all([
        listFormFields(form.id, form.tenantId),
        listFormSubmissions(form.tenantId, { formId: form.id }),
    ]);
    const sections = deriveSections(fields);
    const kpis = computeKpis(fields, submissions);
    return { form, fields, sections, submissions, kpis };
}
export async function createFormForTenant(data, tenantIdHint) {
    const tenantId = await resolveTenantId(tenantIdHint);
    await assertTenantAccess(tenantId);
    return createForm(tenantId, data);
}
export async function updateFormForTenant(formId, data, tenantIdHint) {
    const tenantId = await resolveTenantId(tenantIdHint);
    const existing = await getForm(formId, tenantId);
    if (!existing)
        throw new Error("FORM_NOT_FOUND");
    await assertTenantAccess(existing.tenantId);
    return updateForm(formId, existing.tenantId, data);
}
export async function deleteFormForTenant(formId, tenantIdHint) {
    const tenantId = await resolveTenantId(tenantIdHint);
    const existing = await getForm(formId, tenantId);
    if (!existing)
        return;
    await assertTenantAccess(existing.tenantId);
    await deleteForm(formId, existing.tenantId);
}
export async function upsertFieldForTenant(formId, field, tenantIdHint) {
    const tenantId = await resolveTenantId(tenantIdHint);
    const form = await getForm(formId, tenantId);
    if (!form)
        throw new Error("FORM_NOT_FOUND");
    await assertTenantAccess(form.tenantId);
    return upsertFormField(formId, form.tenantId, field);
}
export async function deleteFieldForTenant(formId, fieldId, tenantIdHint) {
    const tenantId = await resolveTenantId(tenantIdHint);
    const form = await getForm(formId, tenantId);
    if (!form)
        throw new Error("FORM_NOT_FOUND");
    await assertTenantAccess(form.tenantId);
    await deleteFormField(fieldId, form.tenantId);
}
export async function validateForm(formId, answers, tenantIdHint) {
    const tenantId = await resolveTenantId(tenantIdHint);
    const bundle = await getFormWithFields(formId, tenantId);
    if (!bundle)
        throw new Error("FORM_NOT_FOUND");
    return validateAnswers(bundle.fields, answers);
}
export async function submitForm(formId, answers, context = {}) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const tenantId = await resolveTenantId(context.tenantId);
    const form = await getForm(formId, tenantId);
    if (!form)
        throw new Error("FORM_NOT_FOUND");
    const isPublicSubmission = form.isPublic === true;
    if (!isPublicSubmission) {
        await assertTenantAccess(form.tenantId);
    }
    const fields = await listFormFields(form.id, form.tenantId);
    const validation = context.skipValidation
        ? { valid: true, issues: [] }
        : validateAnswers(fields, answers);
    if (!validation.valid) {
        return {
            submission: {
                id: "",
                tenantId: form.tenantId,
                formId: form.id,
                status: "started",
                submittedBy: (_b = (_a = context.submittedBy) !== null && _a !== void 0 ? _a : context.profileId) !== null && _b !== void 0 ? _b : null,
                profileId: (_c = context.profileId) !== null && _c !== void 0 ? _c : null,
                answers,
                metadata: (_d = context.metadata) !== null && _d !== void 0 ? _d : {},
                startedAt: (_e = context.startedAt) !== null && _e !== void 0 ? _e : new Date().toISOString(),
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
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const field = (_a = fields.find((f) => f.id === a.fieldId)) !== null && _a !== void 0 ? _a : fields.find((f) => f.fieldKey === a.fieldKey);
        return {
            fieldId: (_c = (_b = field === null || field === void 0 ? void 0 : field.id) !== null && _b !== void 0 ? _b : a.fieldId) !== null && _c !== void 0 ? _c : "",
            fieldKey: (_e = (_d = field === null || field === void 0 ? void 0 : field.fieldKey) !== null && _d !== void 0 ? _d : a.fieldKey) !== null && _e !== void 0 ? _e : "",
            label: (_h = (_g = (_f = field === null || field === void 0 ? void 0 : field.label) !== null && _f !== void 0 ? _f : a.label) !== null && _g !== void 0 ? _g : a.fieldKey) !== null && _h !== void 0 ? _h : "",
            value: a.value,
            answeredAt: (_j = a.answeredAt) !== null && _j !== void 0 ? _j : new Date().toISOString(),
        };
    });
    const input = {
        answers: normalizedAnswers,
        profileId: (_f = context.profileId) !== null && _f !== void 0 ? _f : null,
        submittedBy: (_h = (_g = context.submittedBy) !== null && _g !== void 0 ? _g : context.profileId) !== null && _h !== void 0 ? _h : null,
        status: "completed",
        startedAt: (_j = context.startedAt) !== null && _j !== void 0 ? _j : new Date().toISOString(),
        completedAt: new Date().toISOString(),
        metadata: (_k = context.metadata) !== null && _k !== void 0 ? _k : {},
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
    let automationsDispatched = 0;
    try {
        const executions = await dispatchAutomationEvent("form.submitted", {
            tenantId: form.tenantId,
            profileId: (_l = submission.profileId) !== null && _l !== void 0 ? _l : undefined,
            locationId: (_m = context.locationId) !== null && _m !== void 0 ? _m : undefined,
            data: {
                formId: form.id,
                formName: form.name,
                formSlug: form.slug,
                submissionId: submission.id,
                status: submission.status,
                answers: submission.answers,
            },
        });
        automationsDispatched = executions.length;
    }
    catch (err) {
        await logAudit("forms.automation.failure", {
            tenantId: form.tenantId,
            formId: form.id,
            submissionId: submission.id,
            error: err instanceof Error ? err.message : String(err),
        });
    }
    return {
        submission,
        validation,
        automationsDispatched,
    };
}
export async function submitPublicFormBySlug(slug, tenantId, answers, context = {}) {
    const form = await getPublicFormBySlug(slug, tenantId);
    if (!form)
        throw new Error("FORM_NOT_FOUND");
    if (!form.isPublic)
        throw new Error("FORM_NOT_PUBLIC");
    return submitForm(form.id, answers, Object.assign(Object.assign({}, context), { tenantId: form.tenantId }));
}
export async function getSubmissionForTenant(submissionId, tenantIdHint) {
    const tenantId = await resolveTenantId(tenantIdHint);
    const submission = await getSubmission(submissionId, tenantId);
    if (!submission)
        return null;
    await assertTenantAccess(submission.tenantId);
    return submission;
}
export async function listSubmissionsForTenant(filter, tenantIdHint) {
    const tenantId = await resolveTenantId(tenantIdHint);
    await assertTenantAccess(tenantId);
    return listFormSubmissions(tenantId, filter);
}
