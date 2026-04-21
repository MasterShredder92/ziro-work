import { getServiceClient } from "@/lib/supabase";
function normalizeId(value) {
    if (typeof value !== "string")
        return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}
function asString(value) {
    if (typeof value !== "string")
        return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}
function firstString(record, keys) {
    for (const key of keys) {
        const value = asString(record[key]);
        if (value)
            return value;
    }
    return null;
}
function joinedName(record, firstKeys, lastKeys) {
    const first = firstString(record, firstKeys);
    const last = firstString(record, lastKeys);
    if (first && last)
        return `${first} ${last}`;
    return first !== null && first !== void 0 ? first : last;
}
function toMetadata(record, excluded) {
    const out = {};
    for (const [key, value] of Object.entries(record)) {
        if (excluded.includes(key))
            continue;
        out[key] = value;
    }
    return out;
}
export async function loadLeadContext(leadId) {
    var _a, _b, _c, _d;
    const id = normalizeId(leadId);
    if (!id)
        return null;
    const supabase = getServiceClient();
    const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("id", id)
        .maybeSingle();
    if (error)
        throw error;
    if (!data)
        return null;
    const record = data;
    const name = (_c = (_b = (_a = firstString(record, ["name", "full_name", "display_name"])) !== null && _a !== void 0 ? _a : joinedName(record, ["first_name"], ["last_name"])) !== null && _b !== void 0 ? _b : firstString(record, ["email"])) !== null && _c !== void 0 ? _c : id;
    const status = (_d = firstString(record, ["stage", "status", "pipeline_stage"])) !== null && _d !== void 0 ? _d : null;
    return {
        id,
        name,
        status,
        metadata: toMetadata(record, []),
    };
}
export async function loadStudentContext(studentId) {
    var _a, _b, _c;
    const id = normalizeId(studentId);
    if (!id)
        return null;
    const supabase = getServiceClient();
    const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("id", id)
        .maybeSingle();
    if (error)
        throw error;
    if (!data)
        return null;
    const record = data;
    const name = (_b = (_a = firstString(record, ["name", "full_name", "display_name"])) !== null && _a !== void 0 ? _a : joinedName(record, ["first_name"], ["last_name"])) !== null && _b !== void 0 ? _b : id;
    const status = (_c = firstString(record, ["status", "enrollment_status"])) !== null && _c !== void 0 ? _c : null;
    return {
        id,
        name,
        status,
        metadata: toMetadata(record, []),
    };
}
export async function loadTeacherContext(teacherId) {
    var _a, _b, _c;
    const id = normalizeId(teacherId);
    if (!id)
        return null;
    const supabase = getServiceClient();
    const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .eq("id", id)
        .maybeSingle();
    if (error)
        throw error;
    if (!data)
        return null;
    const record = data;
    const name = (_b = (_a = firstString(record, ["name", "full_name", "display_name"])) !== null && _a !== void 0 ? _a : joinedName(record, ["first_name"], ["last_name"])) !== null && _b !== void 0 ? _b : id;
    const status = (_c = firstString(record, ["status", "employment_status", "availability_status"])) !== null && _c !== void 0 ? _c : null;
    return {
        id,
        name,
        status,
        metadata: toMetadata(record, []),
    };
}
export async function loadFamilyContext(familyId) {
    var _a, _b, _c;
    const id = normalizeId(familyId);
    if (!id)
        return null;
    const supabase = getServiceClient();
    const { data, error } = await supabase
        .from("families")
        .select("*")
        .eq("id", id)
        .maybeSingle();
    if (error)
        throw error;
    if (!data)
        return null;
    const record = data;
    const name = (_b = (_a = firstString(record, ["name", "family_name", "display_name"])) !== null && _a !== void 0 ? _a : firstString(record, ["primary_email", "primary_phone"])) !== null && _b !== void 0 ? _b : id;
    const status = (_c = firstString(record, ["billing_status", "status", "account_status"])) !== null && _c !== void 0 ? _c : null;
    return {
        id,
        name,
        status,
        metadata: toMetadata(record, []),
    };
}
export async function loadInvoiceContext(invoiceId) {
    var _a, _b;
    const id = normalizeId(invoiceId);
    if (!id)
        return null;
    const supabase = getServiceClient();
    const { data, error } = await supabase
        .from("square_invoices")
        .select("*")
        .eq("id", id)
        .maybeSingle();
    if (error)
        throw error;
    if (!data)
        return null;
    const record = data;
    const name = (_a = firstString(record, ["title", "invoice_number", "public_url", "description"])) !== null && _a !== void 0 ? _a : id;
    const status = (_b = firstString(record, ["status", "payment_status"])) !== null && _b !== void 0 ? _b : null;
    return {
        id,
        name,
        status,
        metadata: toMetadata(record, []),
    };
}
export const CONTEXT_LOADERS = {
    lead: loadLeadContext,
    student: loadStudentContext,
    teacher: loadTeacherContext,
    family: loadFamilyContext,
    invoice: loadInvoiceContext,
};
export const CONTEXT_LOADER_ID_KEYS = {
    lead: ["leadId", "lead_id", "lead"],
    student: ["studentId", "student_id", "student"],
    teacher: ["teacherId", "teacher_id", "teacher"],
    family: ["familyId", "family_id", "family"],
    invoice: ["invoiceId", "invoice_id", "invoice"],
};
export function isContextLoaderName(value) {
    return value in CONTEXT_LOADERS;
}
