import { decodeCursor, encodeCursor, offsetRange, toErrorInfo } from "./core";
function escapeLikeTerm(term) {
    return term.replace(/%/g, "\\%").replace(/_/g, "\\_");
}
function applyStudentSearch(q, term) {
    const t = `%${escapeLikeTerm(term)}%`;
    return q.or([`first_name.ilike.${t}`, `last_name.ilike.${t}`, `email.ilike.${t}`, `phone.ilike.${t}`].join(","));
}
function isMissingStudentsTableError(err) {
    var _a;
    const msg = err && typeof err === "object" && "message" in err
        ? String((_a = err.message) !== null && _a !== void 0 ? _a : "")
        : String(err !== null && err !== void 0 ? err : "");
    return (msg.includes("Could not find the table") ||
        msg.includes("table 'public.students'") ||
        msg.includes('relation "public.students" does not exist') ||
        msg.includes("public.students"));
}
function emptyOffsetList(page) {
    if (page.mode === "offset") {
        const { page: p, pageSize, from, to } = offsetRange(page.page, page.pageSize);
        return {
            items: [],
            pageInfo: { mode: "offset", page: p, pageSize, range: { from, to } },
        };
    }
    const limit = Number.isFinite(page.limit) && page.limit > 0 ? Math.floor(page.limit) : 50;
    return {
        items: [],
        pageInfo: { mode: "cursor", cursor: page.cursor, limit, nextCursor: undefined },
    };
}
export async function listStudents(client, params) {
    var _a;
    try {
        const baseQuery = () => {
            let q = client
                .from("students")
                .select("*")
                .eq("tenant_id", params.tenantId);
            if (params.includeArchived !== true)
                q = q.is("deactivated_at", null);
            if (params.status)
                q = q.eq("status", params.status);
            if (params.familyId)
                q = q.eq("family_id", params.familyId);
            if (params.teacherId)
                q = q.eq("teacher_id", params.teacherId);
            if (params.search && params.search.trim().length > 0) {
                q = applyStudentSearch(q, params.search.trim());
            }
            return q;
        };
        let q = client
            .from("students")
            .select("*")
            .eq("tenant_id", params.tenantId);
        if (params.includeArchived !== true)
            q = q.is("deactivated_at", null);
        if (params.status)
            q = q.eq("status", params.status);
        if (params.familyId)
            q = q.eq("family_id", params.familyId);
        if (params.teacherId)
            q = q.eq("teacher_id", params.teacherId);
        if (params.locationId) {
            q = q.or([
                `location_id.eq.${params.locationId}`,
                "location_id.is.null",
            ].join(","));
        }
        if (params.search && params.search.trim().length > 0)
            q = applyStudentSearch(q, params.search.trim());
        if (params.page.mode === "offset") {
            const { page, pageSize, from, to } = offsetRange(params.page.page, params.page.pageSize);
            const { data, error } = await q
                .order("created_at", { ascending: false })
                .order("id", { ascending: false })
                .range(from, to);
            if (!error && params.locationId && (data !== null && data !== void 0 ? data : []).length === 0) {
                const { data: fallbackData, error: fallbackError } = await baseQuery()
                    .order("created_at", { ascending: false })
                    .order("id", { ascending: false })
                    .range(from, to);
                if (!fallbackError) {
                    return {
                        data: {
                            items: (fallbackData !== null && fallbackData !== void 0 ? fallbackData : []).map((r) => r),
                            pageInfo: { mode: "offset", page, pageSize, range: { from, to } },
                        },
                        error: null,
                    };
                }
            }
            if (error) {
                if (isMissingStudentsTableError(error)) {
                    console.error("Supabase students table missing or query failed:", error);
                    return { data: emptyOffsetList(params.page), error: null };
                }
                return { data: null, error: toErrorInfo(error) };
            }
            return {
                data: {
                    items: (data !== null && data !== void 0 ? data : []).map((r) => r),
                    pageInfo: { mode: "offset", page, pageSize, range: { from, to } },
                },
                error: null,
            };
        }
        const limit = Number.isFinite(params.page.limit) && params.page.limit > 0
            ? Math.floor(params.page.limit)
            : 50;
        const cursor = (_a = params.page.cursor) === null || _a === void 0 ? void 0 : _a.trim();
        const decoded = cursor ? decodeCursor(cursor) : null;
        let cq = q
            .order("created_at", { ascending: false })
            .order("id", { ascending: false })
            .limit(limit);
        if ((decoded === null || decoded === void 0 ? void 0 : decoded.created_at) && (decoded === null || decoded === void 0 ? void 0 : decoded.id)) {
            cq = cq.or([
                `created_at.lt.${decoded.created_at}`,
                `and(created_at.eq.${decoded.created_at},id.lt.${decoded.id})`,
            ].join(","));
        }
        const { data, error } = await cq;
        if (!error && params.locationId && (data !== null && data !== void 0 ? data : []).length === 0) {
            const fallbackCursorQuery = baseQuery()
                .order("created_at", { ascending: false })
                .order("id", { ascending: false })
                .limit(limit);
            const { data: fallbackData, error: fallbackError } = await fallbackCursorQuery;
            if (!fallbackError) {
                const fallbackItems = (fallbackData !== null && fallbackData !== void 0 ? fallbackData : []).map((r) => r);
                const fallbackLast = fallbackItems.at(-1);
                const fallbackNextCursor = (fallbackLast === null || fallbackLast === void 0 ? void 0 : fallbackLast.created_at) && (fallbackLast === null || fallbackLast === void 0 ? void 0 : fallbackLast.id)
                    ? encodeCursor({ created_at: fallbackLast.created_at, id: fallbackLast.id })
                    : undefined;
                return {
                    data: {
                        items: fallbackItems,
                        pageInfo: { mode: "cursor", cursor: cursor || undefined, limit, nextCursor: fallbackNextCursor },
                    },
                    error: null,
                };
            }
        }
        if (error) {
            if (isMissingStudentsTableError(error)) {
                console.error("Supabase students table missing or query failed:", error);
                return { data: emptyOffsetList(params.page), error: null };
            }
            return { data: null, error: toErrorInfo(error) };
        }
        const items = (data !== null && data !== void 0 ? data : []).map((r) => r);
        const last = items.at(-1);
        const nextCursor = (last === null || last === void 0 ? void 0 : last.created_at) && (last === null || last === void 0 ? void 0 : last.id)
            ? encodeCursor({ created_at: last.created_at, id: last.id })
            : undefined;
        return {
            data: {
                items,
                pageInfo: { mode: "cursor", cursor: cursor || undefined, limit, nextCursor },
            },
            error: null,
        };
    }
    catch (err) {
        if (isMissingStudentsTableError(err)) {
            console.error("Supabase students table missing or query failed:", err);
            return { data: emptyOffsetList(params.page), error: null };
        }
        return { data: null, error: toErrorInfo(err) };
    }
}
export async function getStudentById(client, tenantId, id) {
    try {
        const { data, error } = await client
            .from("students")
            .select("*")
            .eq("tenant_id", tenantId)
            .eq("id", id)
            .maybeSingle();
        if (error) {
            if (isMissingStudentsTableError(error)) {
                console.error("Supabase students table missing or query failed:", error);
                return { data: null, error: null };
            }
            return { data: null, error: toErrorInfo(error) };
        }
        return { data: (data !== null && data !== void 0 ? data : null), error: null };
    }
    catch (err) {
        if (isMissingStudentsTableError(err)) {
            console.error("Supabase students table missing or query failed:", err);
            return { data: null, error: null };
        }
        return { data: null, error: toErrorInfo(err) };
    }
}
export async function createStudent(client, input) {
    try {
        const { data, error } = await client
            .from("students")
            .insert(input)
            .select("*")
            .single();
        if (error) {
            if (isMissingStudentsTableError(error)) {
                console.error("Supabase students table missing or query failed:", error);
                return { data: null, error: toErrorInfo(error) };
            }
            return { data: null, error: toErrorInfo(error) };
        }
        return { data: data, error: null };
    }
    catch (err) {
        if (isMissingStudentsTableError(err)) {
            console.error("Supabase students table missing or query failed:", err);
            return { data: null, error: toErrorInfo(err) };
        }
        return { data: null, error: toErrorInfo(err) };
    }
}
export async function updateStudent(client, tenantId, id, patch) {
    try {
        const { data, error } = await client
            .from("students")
            .update(patch)
            .eq("tenant_id", tenantId)
            .eq("id", id)
            .select("*")
            .single();
        if (error) {
            if (isMissingStudentsTableError(error)) {
                console.error("Supabase students table missing or query failed:", error);
                return { data: null, error: toErrorInfo(error) };
            }
            return { data: null, error: toErrorInfo(error) };
        }
        return { data: data, error: null };
    }
    catch (err) {
        if (isMissingStudentsTableError(err)) {
            console.error("Supabase students table missing or query failed:", err);
            return { data: null, error: toErrorInfo(err) };
        }
        return { data: null, error: toErrorInfo(err) };
    }
}
export async function isStudentsTableAvailable(client) {
    try {
        const { error } = await client
            .from("students")
            .select("id", { count: "exact", head: true })
            .limit(1);
        if (error) {
            if (isMissingStudentsTableError(error))
                return false;
            return false;
        }
        return true;
    }
    catch (err) {
        if (isMissingStudentsTableError(err))
            return false;
        return false;
    }
}
