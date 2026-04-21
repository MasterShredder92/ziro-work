import { decodeCursor, encodeCursor, offsetRange, toErrorInfo } from "./core";
export async function listStudentLifecycle(client, params) {
    var _a;
    try {
        const base = client
            .from("student_lifecycle")
            .select("*")
            .eq("tenant_id", params.tenantId)
            .eq("student_id", params.studentId);
        if (params.page.mode === "offset") {
            const { page, pageSize, from, to } = offsetRange(params.page.page, params.page.pageSize);
            const { data, error } = await base
                .order("occurred_at", { ascending: false })
                .order("id", { ascending: false })
                .range(from, to);
            if (error)
                return { data: null, error: toErrorInfo(error) };
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
            : 100;
        const cursor = (_a = params.page.cursor) === null || _a === void 0 ? void 0 : _a.trim();
        const decoded = cursor ? decodeCursor(cursor) : null;
        let q = base
            .order("occurred_at", { ascending: false })
            .order("id", { ascending: false })
            .limit(limit);
        if ((decoded === null || decoded === void 0 ? void 0 : decoded.occurred_at) && (decoded === null || decoded === void 0 ? void 0 : decoded.id)) {
            q = q.or([
                `occurred_at.lt.${decoded.occurred_at}`,
                `and(occurred_at.eq.${decoded.occurred_at},id.lt.${decoded.id})`,
            ].join(","));
        }
        const { data, error } = await q;
        if (error)
            return { data: null, error: toErrorInfo(error) };
        const items = (data !== null && data !== void 0 ? data : []).map((r) => r);
        const last = items.at(-1);
        const nextCursor = (last === null || last === void 0 ? void 0 : last.occurred_at) && (last === null || last === void 0 ? void 0 : last.id)
            ? encodeCursor({ occurred_at: last.occurred_at, id: last.id })
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
        return { data: null, error: toErrorInfo(err) };
    }
}
export async function createStudentLifecycleEntry(client, input) {
    try {
        const { data, error } = await client
            .from("student_lifecycle")
            .insert(input)
            .select("*")
            .single();
        if (error)
            return { data: null, error: toErrorInfo(error) };
        return { data: data, error: null };
    }
    catch (err) {
        return { data: null, error: toErrorInfo(err) };
    }
}
export async function updateStudentLifecycleEntry(client, tenantId, id, patch) {
    try {
        const { data, error } = await client
            .from("student_lifecycle")
            .update(patch)
            .eq("tenant_id", tenantId)
            .eq("id", id)
            .select("*")
            .single();
        if (error)
            return { data: null, error: toErrorInfo(error) };
        return { data: data, error: null };
    }
    catch (err) {
        return { data: null, error: toErrorInfo(err) };
    }
}
