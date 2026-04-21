import { decodeCursor, encodeCursor, offsetRange, toErrorInfo } from "./core";
export async function listEvents(client, params) {
    var _a;
    try {
        let q = client
            .from("events")
            .select("*")
            .eq("tenant_id", params.tenantId);
        if (params.entityType)
            q = q.eq("entity_type", params.entityType);
        if (params.entityId)
            q = q.eq("entity_id", params.entityId);
        if (params.eventType)
            q = q.eq("event_type", params.eventType);
        if (params.page.mode === "offset") {
            const { page, pageSize, from, to } = offsetRange(params.page.page, params.page.pageSize);
            const { data, error } = await q
                .order("created_at", { ascending: false })
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
        if (error)
            return { data: null, error: toErrorInfo(error) };
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
        return { data: null, error: toErrorInfo(err) };
    }
}
export async function createEvent(client, input) {
    try {
        const { data, error } = await client
            .from("events")
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
