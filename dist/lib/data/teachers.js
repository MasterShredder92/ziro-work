import { getServiceClient } from "@/lib/supabase";
import { clientFor } from "./_client";
async function safeQuery(fn) {
    try {
        const data = await fn();
        return { data, error: null };
    }
    catch (err) {
        console.error(err);
        return { data: null, error: err instanceof Error ? err.message : "Unknown error" };
    }
}
export async function getTeachersForTenant(tenantId) {
    return safeQuery(async () => {
        const supabase = getServiceClient();
        const { data, error } = await supabase
            .from("teachers")
            .select("*")
            .eq("tenant_id", tenantId);
        if (error)
            throw error;
        return (data || []);
    });
}
export async function getTeachersByIds(tenantId, ids) {
    if (ids.length === 0)
        return [];
    const supabase = getServiceClient();
    const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .eq("tenant_id", tenantId)
        .in("id", ids);
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : []);
}
export async function listTeachers(tenantId, filter, opts) {
    var _a, _b, _c;
    const supabase = getServiceClient();
    let query = supabase
        .from("teachers")
        .select("*")
        .eq("tenant_id", tenantId);
    if (filter === null || filter === void 0 ? void 0 : filter.status)
        query = query.eq("status", filter.status);
    if (typeof (filter === null || filter === void 0 ? void 0 : filter.is_active) === "boolean")
        query = query.eq("is_active", filter.is_active);
    if (filter === null || filter === void 0 ? void 0 : filter.location_id) {
        const svcClient = getServiceClient();
        const { data: teacherLinks, error: linkErr } = await svcClient
            .from("teacher_locations")
            .select("teacher_id")
            .eq("location_id", filter.location_id);
        if (linkErr)
            throw linkErr;
        const ids = Array.from(new Set((teacherLinks !== null && teacherLinks !== void 0 ? teacherLinks : [])
            .map((r) => r.teacher_id)
            .filter((v) => typeof v === "string" && v.length > 0)));
        if (ids.length === 0)
            return [];
        query = query.in("id", ids);
    }
    query = query.order((_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "created_at", {
        ascending: (_b = opts === null || opts === void 0 ? void 0 : opts.ascending) !== null && _b !== void 0 ? _b : false,
    });
    const limit = (_c = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _c !== void 0 ? _c : 500;
    if (typeof (opts === null || opts === void 0 ? void 0 : opts.offset) === "number") {
        query = query.range(opts.offset, opts.offset + limit - 1);
    }
    else {
        query = query.limit(limit);
    }
    const { data, error } = await query;
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : []);
}
export async function getTeacherById(id) {
    return safeQuery(async () => {
        const supabase = getServiceClient();
        const { data, error } = await supabase
            .from("teachers")
            .select("*")
            .eq("id", id)
            .maybeSingle();
        if (error)
            throw error;
        return (data !== null && data !== void 0 ? data : null);
    });
}
export async function createTeacher(tenantId, input) {
    var _a;
    const supabase = clientFor(tenantId);
    const payload = Object.assign(Object.assign({}, input), { tenant_id: tenantId, instruments: (_a = input.instruments) !== null && _a !== void 0 ? _a : [] });
    const { data, error } = await supabase
        .from("teachers")
        .insert(payload)
        .select("*")
        .single();
    if (error)
        throw error;
    return data;
}
export async function updateTeacher(id, tenantId, input) {
    const supabase = clientFor(tenantId);
    const patch = Object.assign(Object.assign({}, input), { updated_at: new Date().toISOString() });
    const { data, error } = await supabase
        .from("teachers")
        .update(patch)
        .eq("tenant_id", tenantId)
        .eq("id", id)
        .select("*")
        .single();
    if (error)
        throw error;
    return data;
}
export async function deleteTeacher(id, tenantId) {
    const supabase = clientFor(tenantId);
    const { error } = await supabase
        .from("teachers")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("id", id);
    if (error)
        throw error;
}
export async function getTeacherAvailability(teacherId) {
    return safeQuery(async () => {
        const supabase = getServiceClient();
        const { data, error } = await supabase
            .from("teacher_availability")
            .select("*")
            .eq("teacher_id", teacherId);
        if (error)
            throw error;
        return (data || []);
    });
}
