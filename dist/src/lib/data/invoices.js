import { decodeCursor, encodeCursor, offsetRange, toErrorInfo } from "./core";
function applyInvoiceFilters(q, filters, tenantId) {
    let out = q.eq("tenant_id", tenantId);
    const f = filters !== null && filters !== void 0 ? filters : {};
    if (f.status)
        out = out.eq("status", f.status);
    if (f.familyId)
        out = out.eq("family_id", f.familyId);
    // Keep filters aligned with public.invoices schema.
    if (f.issuedFrom)
        out = out.gte("created_at", f.issuedFrom);
    if (f.issuedTo)
        out = out.lte("created_at", f.issuedTo);
    if (f.dueFrom)
        out = out.gte("due_date", f.dueFrom);
    if (f.dueTo)
        out = out.lte("due_date", f.dueTo);
    return out;
}
export async function listInvoices(client, params) {
    var _a;
    try {
        let q = client.from("invoices").select("*");
        q = applyInvoiceFilters(q, params.filters, params.tenantId);
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
export async function getInvoiceById(client, tenantId, id) {
    try {
        const { data, error } = await client
            .from("invoices")
            .select("*")
            .eq("tenant_id", tenantId)
            .eq("id", id)
            .maybeSingle();
        if (error)
            return { data: null, error: toErrorInfo(error) };
        return { data: (data !== null && data !== void 0 ? data : null), error: null };
    }
    catch (err) {
        return { data: null, error: toErrorInfo(err) };
    }
}
export async function createInvoice(client, input) {
    try {
        const { data, error } = await client
            .from("invoices")
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
export async function updateInvoice(client, tenantId, id, patch) {
    try {
        const { data, error } = await client
            .from("invoices")
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
