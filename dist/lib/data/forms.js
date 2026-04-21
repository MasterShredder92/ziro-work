import { clientFor } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing } from "./_missingTable";
const FORMS_TABLE = "forms";
const FIELDS_TABLE = "form_fields";
const SUBMISSIONS_TABLE = "form_submissions";
function formsStore() {
    const g = globalThis;
    if (!g.__ziro_forms_store)
        g.__ziro_forms_store = new Map();
    return g.__ziro_forms_store;
}
function fieldsStore() {
    const g = globalThis;
    if (!g.__ziro_form_fields_store)
        g.__ziro_form_fields_store = new Map();
    return g.__ziro_form_fields_store;
}
function submissionsStore() {
    const g = globalThis;
    if (!g.__ziro_form_submissions_store)
        g.__ziro_form_submissions_store = new Map();
    return g.__ziro_form_submissions_store;
}
function nowIso() {
    return new Date().toISOString();
}
function uuid() {
    const c = globalThis.crypto;
    if (c === null || c === void 0 ? void 0 : c.randomUUID)
        return c.randomUUID();
    return `form_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}
function slugify(v) {
    return (v !== null && v !== void 0 ? v : "form")
        .toLowerCase()
        .replace(/[^a-z0-9\s_-]+/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .slice(0, 64) || "form";
}
function listFormsFromStore(tenantId, filter) {
    var _a, _b, _c, _d;
    const out = [];
    for (const row of formsStore().values()) {
        if (row.tenant_id !== tenantId)
            continue;
        if (!(filter === null || filter === void 0 ? void 0 : filter.includeArchived) && row.status === "archived")
            continue;
        if ((filter === null || filter === void 0 ? void 0 : filter.status) && row.status !== filter.status)
            continue;
        if ((filter === null || filter === void 0 ? void 0 : filter.search) && filter.search.trim().length > 0) {
            const s = filter.search.trim().toLowerCase();
            const hit = row.name.toLowerCase().includes(s) ||
                ((_b = (_a = row.slug) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(s)) !== null && _b !== void 0 ? _b : false) ||
                ((_d = (_c = row.description) === null || _c === void 0 ? void 0 : _c.toLowerCase().includes(s)) !== null && _d !== void 0 ? _d : false);
            if (!hit)
                continue;
        }
        out.push(row);
    }
    return out.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}
export async function listForms(tenantId, filter) {
    if (tableMissing(FORMS_TABLE))
        return listFormsFromStore(tenantId, filter);
    try {
        const supabase = clientFor(tenantId);
        let query = supabase
            .from(FORMS_TABLE)
            .select("*")
            .eq("tenant_id", tenantId);
        if (!(filter === null || filter === void 0 ? void 0 : filter.includeArchived))
            query = query.neq("status", "archived");
        if (filter === null || filter === void 0 ? void 0 : filter.status)
            query = query.eq("status", filter.status);
        const { data, error } = await query.order("updated_at", {
            ascending: false,
        });
        if (error)
            throw error;
        return (data !== null && data !== void 0 ? data : []);
    }
    catch (err) {
        if (isMissingTableError(err, FORMS_TABLE)) {
            markTableMissing(FORMS_TABLE);
            return listFormsFromStore(tenantId, filter);
        }
        throw err;
    }
}
export async function getForm(id, tenantId) {
    if (tableMissing(FORMS_TABLE)) {
        const row = formsStore().get(id);
        if (!row || row.tenant_id !== tenantId)
            return null;
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
        if (error)
            throw error;
        return (data !== null && data !== void 0 ? data : null);
    }
    catch (err) {
        if (isMissingTableError(err, FORMS_TABLE)) {
            markTableMissing(FORMS_TABLE);
            return getForm(id, tenantId);
        }
        throw err;
    }
}
export async function getPublicFormBySlug(slug, tenantId) {
    if (tableMissing(FORMS_TABLE)) {
        for (const row of formsStore().values()) {
            if (row.tenant_id === tenantId &&
                row.slug === slug &&
                row.is_public === true) {
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
        if (error)
            throw error;
        return (data !== null && data !== void 0 ? data : null);
    }
    catch (err) {
        if (isMissingTableError(err, FORMS_TABLE)) {
            markTableMissing(FORMS_TABLE);
            return getPublicFormBySlug(slug, tenantId);
        }
        throw err;
    }
}
function mergeFormUpsert(existing, tenantId, input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3;
    const id = (_b = (_a = input.id) !== null && _a !== void 0 ? _a : existing === null || existing === void 0 ? void 0 : existing.id) !== null && _b !== void 0 ? _b : uuid();
    const now = nowIso();
    const name = (_d = (_c = input.name) !== null && _c !== void 0 ? _c : existing === null || existing === void 0 ? void 0 : existing.name) !== null && _d !== void 0 ? _d : "Untitled form";
    const slugSource = (_f = (_e = input.slug) !== null && _e !== void 0 ? _e : existing === null || existing === void 0 ? void 0 : existing.slug) !== null && _f !== void 0 ? _f : slugify(name);
    return {
        id,
        tenant_id: tenantId,
        name,
        slug: slugSource,
        description: (_h = (_g = input.description) !== null && _g !== void 0 ? _g : existing === null || existing === void 0 ? void 0 : existing.description) !== null && _h !== void 0 ? _h : null,
        status: (_k = (_j = input.status) !== null && _j !== void 0 ? _j : existing === null || existing === void 0 ? void 0 : existing.status) !== null && _k !== void 0 ? _k : "draft",
        is_public: (_m = (_l = input.is_public) !== null && _l !== void 0 ? _l : existing === null || existing === void 0 ? void 0 : existing.is_public) !== null && _m !== void 0 ? _m : false,
        submit_label: (_p = (_o = input.submit_label) !== null && _o !== void 0 ? _o : existing === null || existing === void 0 ? void 0 : existing.submit_label) !== null && _p !== void 0 ? _p : null,
        success_message: (_r = (_q = input.success_message) !== null && _q !== void 0 ? _q : existing === null || existing === void 0 ? void 0 : existing.success_message) !== null && _r !== void 0 ? _r : null,
        success_redirect_url: (_t = (_s = input.success_redirect_url) !== null && _s !== void 0 ? _s : existing === null || existing === void 0 ? void 0 : existing.success_redirect_url) !== null && _t !== void 0 ? _t : null,
        settings: (_v = (_u = input.settings) !== null && _u !== void 0 ? _u : existing === null || existing === void 0 ? void 0 : existing.settings) !== null && _v !== void 0 ? _v : {},
        created_at: (_x = (_w = input.created_at) !== null && _w !== void 0 ? _w : existing === null || existing === void 0 ? void 0 : existing.created_at) !== null && _x !== void 0 ? _x : now,
        updated_at: now,
        created_by: (_z = (_y = input.created_by) !== null && _y !== void 0 ? _y : existing === null || existing === void 0 ? void 0 : existing.created_by) !== null && _z !== void 0 ? _z : null,
        updated_by: (_3 = (_2 = (_1 = (_0 = input.updated_by) !== null && _0 !== void 0 ? _0 : input.created_by) !== null && _1 !== void 0 ? _1 : existing === null || existing === void 0 ? void 0 : existing.updated_by) !== null && _2 !== void 0 ? _2 : existing === null || existing === void 0 ? void 0 : existing.created_by) !== null && _3 !== void 0 ? _3 : null,
    };
}
export async function upsertForm(tenantId, input) {
    const existing = input.id ? await getForm(input.id, tenantId) : null;
    const next = mergeFormUpsert(existing !== null && existing !== void 0 ? existing : undefined, tenantId, input);
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
        if (error)
            throw error;
        return data;
    }
    catch (err) {
        if (isMissingTableError(err, FORMS_TABLE)) {
            markTableMissing(FORMS_TABLE);
            formsStore().set(next.id, next);
            return next;
        }
        throw err;
    }
}
export async function deleteForm(formId, tenantId) {
    if (tableMissing(FORMS_TABLE)) {
        const row = formsStore().get(formId);
        if (row && row.tenant_id === tenantId)
            formsStore().delete(formId);
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
        if (error)
            throw error;
    }
    catch (err) {
        if (isMissingTableError(err, FORMS_TABLE)) {
            markTableMissing(FORMS_TABLE);
            return deleteForm(formId, tenantId);
        }
        throw err;
    }
}
function listFieldsFromStore(formId, tenantId) {
    const out = [];
    for (const row of fieldsStore().values()) {
        if (row.tenant_id === tenantId && row.form_id === formId)
            out.push(row);
    }
    return out.sort((a, b) => a.position - b.position);
}
export async function listFormFields(formId, tenantId) {
    if (tableMissing(FIELDS_TABLE))
        return listFieldsFromStore(formId, tenantId);
    try {
        const supabase = clientFor(tenantId);
        const { data, error } = await supabase
            .from(FIELDS_TABLE)
            .select("*")
            .eq("tenant_id", tenantId)
            .eq("form_id", formId)
            .order("position", { ascending: true });
        if (error)
            throw error;
        return (data !== null && data !== void 0 ? data : []);
    }
    catch (err) {
        if (isMissingTableError(err, FIELDS_TABLE)) {
            markTableMissing(FIELDS_TABLE);
            return listFieldsFromStore(formId, tenantId);
        }
        throw err;
    }
}
async function getFieldById(id, tenantId) {
    if (tableMissing(FIELDS_TABLE)) {
        const row = fieldsStore().get(id);
        if (!row || row.tenant_id !== tenantId)
            return null;
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
        if (error)
            throw error;
        return (data !== null && data !== void 0 ? data : null);
    }
    catch (err) {
        if (isMissingTableError(err, FIELDS_TABLE)) {
            markTableMissing(FIELDS_TABLE);
            return getFieldById(id, tenantId);
        }
        throw err;
    }
}
function mergeFieldUpsert(existing, tenantId, input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2;
    const id = (_b = (_a = input.id) !== null && _a !== void 0 ? _a : existing === null || existing === void 0 ? void 0 : existing.id) !== null && _b !== void 0 ? _b : uuid();
    const now = nowIso();
    return {
        id,
        form_id: input.form_id,
        tenant_id: tenantId,
        section_id: (_d = (_c = input.section_id) !== null && _c !== void 0 ? _c : existing === null || existing === void 0 ? void 0 : existing.section_id) !== null && _d !== void 0 ? _d : null,
        section_title: (_f = (_e = input.section_title) !== null && _e !== void 0 ? _e : existing === null || existing === void 0 ? void 0 : existing.section_title) !== null && _f !== void 0 ? _f : null,
        field_key: (_h = (_g = input.field_key) !== null && _g !== void 0 ? _g : existing === null || existing === void 0 ? void 0 : existing.field_key) !== null && _h !== void 0 ? _h : id,
        label: (_k = (_j = input.label) !== null && _j !== void 0 ? _j : existing === null || existing === void 0 ? void 0 : existing.label) !== null && _k !== void 0 ? _k : "Untitled field",
        field_type: (_m = (_l = input.field_type) !== null && _l !== void 0 ? _l : existing === null || existing === void 0 ? void 0 : existing.field_type) !== null && _m !== void 0 ? _m : "text",
        placeholder: (_p = (_o = input.placeholder) !== null && _o !== void 0 ? _o : existing === null || existing === void 0 ? void 0 : existing.placeholder) !== null && _p !== void 0 ? _p : null,
        help_text: (_r = (_q = input.help_text) !== null && _q !== void 0 ? _q : existing === null || existing === void 0 ? void 0 : existing.help_text) !== null && _r !== void 0 ? _r : null,
        required: (_t = (_s = input.required) !== null && _s !== void 0 ? _s : existing === null || existing === void 0 ? void 0 : existing.required) !== null && _t !== void 0 ? _t : false,
        position: typeof input.position === "number"
            ? input.position
            : (_u = existing === null || existing === void 0 ? void 0 : existing.position) !== null && _u !== void 0 ? _u : listFieldsFromStore(input.form_id, tenantId).length,
        options: (_w = (_v = input.options) !== null && _v !== void 0 ? _v : existing === null || existing === void 0 ? void 0 : existing.options) !== null && _w !== void 0 ? _w : [],
        validation_rules: (_y = (_x = input.validation_rules) !== null && _x !== void 0 ? _x : existing === null || existing === void 0 ? void 0 : existing.validation_rules) !== null && _y !== void 0 ? _y : [],
        default_value: input.default_value !== undefined
            ? input.default_value
            : (_z = existing === null || existing === void 0 ? void 0 : existing.default_value) !== null && _z !== void 0 ? _z : null,
        metadata: (_1 = (_0 = input.metadata) !== null && _0 !== void 0 ? _0 : existing === null || existing === void 0 ? void 0 : existing.metadata) !== null && _1 !== void 0 ? _1 : {},
        created_at: (_2 = existing === null || existing === void 0 ? void 0 : existing.created_at) !== null && _2 !== void 0 ? _2 : now,
        updated_at: now,
    };
}
export async function upsertFormField(tenantId, input) {
    const existing = input.id ? await getFieldById(input.id, tenantId) : null;
    const next = mergeFieldUpsert(existing !== null && existing !== void 0 ? existing : undefined, tenantId, input);
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
        if (error)
            throw error;
        return data;
    }
    catch (err) {
        if (isMissingTableError(err, FIELDS_TABLE)) {
            markTableMissing(FIELDS_TABLE);
            fieldsStore().set(next.id, next);
            return next;
        }
        throw err;
    }
}
export async function deleteFormField(fieldId, tenantId) {
    if (tableMissing(FIELDS_TABLE)) {
        const row = fieldsStore().get(fieldId);
        if (row && row.tenant_id === tenantId)
            fieldsStore().delete(fieldId);
        return;
    }
    try {
        const supabase = clientFor(tenantId);
        const { error } = await supabase
            .from(FIELDS_TABLE)
            .delete()
            .eq("tenant_id", tenantId)
            .eq("id", fieldId);
        if (error)
            throw error;
    }
    catch (err) {
        if (isMissingTableError(err, FIELDS_TABLE)) {
            markTableMissing(FIELDS_TABLE);
            return deleteFormField(fieldId, tenantId);
        }
        throw err;
    }
}
function listSubmissionsFromStore(tenantId, filter) {
    const out = [];
    for (const row of submissionsStore().values()) {
        if (row.tenant_id !== tenantId)
            continue;
        if ((filter === null || filter === void 0 ? void 0 : filter.formId) && row.form_id !== filter.formId)
            continue;
        if ((filter === null || filter === void 0 ? void 0 : filter.status) && row.status !== filter.status)
            continue;
        if ((filter === null || filter === void 0 ? void 0 : filter.profileId) && row.profile_id !== filter.profileId)
            continue;
        out.push(row);
    }
    return out.sort((a, b) => b.created_at.localeCompare(a.created_at));
}
export async function listFormSubmissions(tenantId, filter) {
    if (tableMissing(SUBMISSIONS_TABLE))
        return listSubmissionsFromStore(tenantId, filter);
    try {
        const supabase = clientFor(tenantId);
        let query = supabase
            .from(SUBMISSIONS_TABLE)
            .select("*")
            .eq("tenant_id", tenantId);
        if (filter === null || filter === void 0 ? void 0 : filter.formId)
            query = query.eq("form_id", filter.formId);
        if (filter === null || filter === void 0 ? void 0 : filter.status)
            query = query.eq("status", filter.status);
        if (filter === null || filter === void 0 ? void 0 : filter.profileId)
            query = query.eq("profile_id", filter.profileId);
        const { data, error } = await query.order("created_at", {
            ascending: false,
        });
        if (error)
            throw error;
        return (data !== null && data !== void 0 ? data : []);
    }
    catch (err) {
        if (isMissingTableError(err, SUBMISSIONS_TABLE)) {
            markTableMissing(SUBMISSIONS_TABLE);
            return listSubmissionsFromStore(tenantId, filter);
        }
        throw err;
    }
}
export async function getFormSubmission(submissionId, tenantId) {
    if (tableMissing(SUBMISSIONS_TABLE)) {
        const row = submissionsStore().get(submissionId);
        if (!row || row.tenant_id !== tenantId)
            return null;
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
        if (error)
            throw error;
        return (data !== null && data !== void 0 ? data : null);
    }
    catch (err) {
        if (isMissingTableError(err, SUBMISSIONS_TABLE)) {
            markTableMissing(SUBMISSIONS_TABLE);
            return getFormSubmission(submissionId, tenantId);
        }
        throw err;
    }
}
export async function upsertFormSubmission(tenantId, input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v;
    const existing = input.id
        ? await getFormSubmission(input.id, tenantId)
        : null;
    const now = nowIso();
    const next = {
        id: (_b = (_a = input.id) !== null && _a !== void 0 ? _a : existing === null || existing === void 0 ? void 0 : existing.id) !== null && _b !== void 0 ? _b : uuid(),
        form_id: input.form_id,
        tenant_id: tenantId,
        status: (_d = (_c = input.status) !== null && _c !== void 0 ? _c : existing === null || existing === void 0 ? void 0 : existing.status) !== null && _d !== void 0 ? _d : "completed",
        submitted_by: (_f = (_e = input.submitted_by) !== null && _e !== void 0 ? _e : existing === null || existing === void 0 ? void 0 : existing.submitted_by) !== null && _f !== void 0 ? _f : null,
        profile_id: (_h = (_g = input.profile_id) !== null && _g !== void 0 ? _g : existing === null || existing === void 0 ? void 0 : existing.profile_id) !== null && _h !== void 0 ? _h : null,
        answers: (_k = (_j = input.answers) !== null && _j !== void 0 ? _j : existing === null || existing === void 0 ? void 0 : existing.answers) !== null && _k !== void 0 ? _k : [],
        metadata: (_m = (_l = input.metadata) !== null && _l !== void 0 ? _l : existing === null || existing === void 0 ? void 0 : existing.metadata) !== null && _m !== void 0 ? _m : {},
        started_at: (_p = (_o = input.started_at) !== null && _o !== void 0 ? _o : existing === null || existing === void 0 ? void 0 : existing.started_at) !== null && _p !== void 0 ? _p : now,
        completed_at: (_r = (_q = input.completed_at) !== null && _q !== void 0 ? _q : existing === null || existing === void 0 ? void 0 : existing.completed_at) !== null && _r !== void 0 ? _r : null,
        duration_ms: (_t = (_s = input.duration_ms) !== null && _s !== void 0 ? _s : existing === null || existing === void 0 ? void 0 : existing.duration_ms) !== null && _t !== void 0 ? _t : null,
        created_at: (_v = (_u = input.created_at) !== null && _u !== void 0 ? _u : existing === null || existing === void 0 ? void 0 : existing.created_at) !== null && _v !== void 0 ? _v : now,
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
        if (error)
            throw error;
        return data;
    }
    catch (err) {
        if (isMissingTableError(err, SUBMISSIONS_TABLE)) {
            markTableMissing(SUBMISSIONS_TABLE);
            submissionsStore().set(next.id, next);
            return next;
        }
        throw err;
    }
}
