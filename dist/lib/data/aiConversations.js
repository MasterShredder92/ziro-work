import { clientFor, applyListOptions } from "./_client";
const CONVERSATIONS = "ai_conversations";
const MESSAGES = "ai_messages";
export async function listAIConversations(tenantId, filter, opts) {
    var _a, _b, _c;
    const supabase = clientFor(tenantId);
    let query = supabase
        .from(CONVERSATIONS)
        .select("*")
        .eq("tenant_id", tenantId);
    if (filter === null || filter === void 0 ? void 0 : filter.profile_id)
        query = query.eq("profile_id", filter.profile_id);
    if (filter === null || filter === void 0 ? void 0 : filter.source)
        query = query.eq("source", filter.source);
    if (filter === null || filter === void 0 ? void 0 : filter.client_route)
        query = query.eq("client_route", filter.client_route);
    const ordered = applyListOptions(query, {
        orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "updated_at",
        ascending: (_b = opts === null || opts === void 0 ? void 0 : opts.ascending) !== null && _b !== void 0 ? _b : false,
        limit: (_c = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _c !== void 0 ? _c : 50,
        offset: opts === null || opts === void 0 ? void 0 : opts.offset,
    });
    const { data, error } = await ordered;
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : []);
}
export async function getAIConversationById(id, tenantId) {
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
        .from(CONVERSATIONS)
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("id", id)
        .maybeSingle();
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : null);
}
export async function createAIConversation(tenantId, input) {
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
        .from(CONVERSATIONS)
        .insert(Object.assign(Object.assign({}, input), { tenant_id: tenantId }))
        .select("*")
        .single();
    if (error)
        throw error;
    return data;
}
export async function updateAIConversation(id, tenantId, input) {
    const supabase = clientFor(tenantId);
    const patch = Object.assign(Object.assign({}, input), { updated_at: new Date().toISOString() });
    const { data, error } = await supabase
        .from(CONVERSATIONS)
        .update(patch)
        .eq("tenant_id", tenantId)
        .eq("id", id)
        .select("*")
        .single();
    if (error)
        throw error;
    return data;
}
export async function touchAIConversation(id, tenantId) {
    const supabase = clientFor(tenantId);
    const { error } = await supabase
        .from(CONVERSATIONS)
        .update({ updated_at: new Date().toISOString() })
        .eq("tenant_id", tenantId)
        .eq("id", id);
    if (error)
        throw error;
}
export async function listAIMessages(conversationId, tenantId, opts) {
    var _a, _b;
    const supabase = clientFor(tenantId);
    const query = supabase
        .from(MESSAGES)
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("conversation_id", conversationId)
        .order("seq", { ascending: (_a = opts === null || opts === void 0 ? void 0 : opts.ascending) !== null && _a !== void 0 ? _a : true })
        .limit((_b = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _b !== void 0 ? _b : 500);
    const { data, error } = await query;
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : []);
}
export async function createAIMessage(tenantId, input) {
    return appendAIMessage(tenantId, input);
}
export async function appendAIMessage(tenantId, input) {
    var _a;
    const supabase = clientFor(tenantId);
    let seq = input.seq;
    if (typeof seq !== "number") {
        const { data: last } = await supabase
            .from(MESSAGES)
            .select("seq")
            .eq("tenant_id", tenantId)
            .eq("conversation_id", input.conversation_id)
            .order("seq", { ascending: false })
            .limit(1)
            .maybeSingle();
        seq = ((_a = last === null || last === void 0 ? void 0 : last.seq) !== null && _a !== void 0 ? _a : 0) + 1;
    }
    const { data, error } = await supabase
        .from(MESSAGES)
        .insert(Object.assign(Object.assign({}, input), { seq, tenant_id: tenantId }))
        .select("*")
        .single();
    if (error)
        throw error;
    await touchAIConversation(input.conversation_id, tenantId);
    return data;
}
export async function deleteAIConversation(id, tenantId) {
    const supabase = clientFor(tenantId);
    await supabase
        .from(MESSAGES)
        .delete()
        .eq("tenant_id", tenantId)
        .eq("conversation_id", id);
    const { error } = await supabase
        .from(CONVERSATIONS)
        .delete()
        .eq("tenant_id", tenantId)
        .eq("id", id);
    if (error)
        throw error;
}
