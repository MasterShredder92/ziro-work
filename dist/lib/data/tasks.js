import { clientFor, applyListOptions } from "./_client";
const TABLE = "tasks";
export async function listTasks(tenantId, filter, opts) {
    var _a, _b, _c;
    const supabase = clientFor(tenantId);
    let query = supabase
        .from(TABLE)
        .select("*")
        .eq("tenant_id", tenantId);
    if (filter === null || filter === void 0 ? void 0 : filter.status) {
        query = query.eq("status", filter.status);
    }
    else if (!(filter === null || filter === void 0 ? void 0 : filter.includeCompleted)) {
        query = query.neq("status", "completed");
    }
    if (filter === null || filter === void 0 ? void 0 : filter.assigned_to)
        query = query.eq("assigned_to", filter.assigned_to);
    if (filter === null || filter === void 0 ? void 0 : filter.assigned_role)
        query = query.eq("assigned_role", filter.assigned_role);
    if (filter === null || filter === void 0 ? void 0 : filter.task_type)
        query = query.eq("task_type", filter.task_type);
    if (filter === null || filter === void 0 ? void 0 : filter.entity_type)
        query = query.eq("entity_type", filter.entity_type);
    if (filter === null || filter === void 0 ? void 0 : filter.entity_id)
        query = query.eq("entity_id", filter.entity_id);
    if (filter === null || filter === void 0 ? void 0 : filter.priority)
        query = query.eq("priority", filter.priority);
    if (filter === null || filter === void 0 ? void 0 : filter.location_id)
        query = query.eq("location_id", filter.location_id);
    if (filter === null || filter === void 0 ? void 0 : filter.due_before)
        query = query.lte("due_date", filter.due_before);
    if (filter === null || filter === void 0 ? void 0 : filter.due_after)
        query = query.gte("due_date", filter.due_after);
    const ordered = applyListOptions(query, {
        orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "due_date",
        ascending: (_b = opts === null || opts === void 0 ? void 0 : opts.ascending) !== null && _b !== void 0 ? _b : true,
        limit: (_c = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _c !== void 0 ? _c : 200,
        offset: opts === null || opts === void 0 ? void 0 : opts.offset,
    });
    const { data, error } = await ordered;
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : []);
}
export async function getTaskById(id, tenantId) {
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("id", id)
        .maybeSingle();
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : null);
}
export async function createTask(tenantId, input) {
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
        .from(TABLE)
        .insert(Object.assign(Object.assign({}, input), { tenant_id: tenantId }))
        .select("*")
        .single();
    if (error)
        throw error;
    return data;
}
export async function updateTask(id, tenantId, input) {
    const supabase = clientFor(tenantId);
    const patch = Object.assign(Object.assign({}, input), { updated_at: new Date().toISOString() });
    const { data, error } = await supabase
        .from(TABLE)
        .update(patch)
        .eq("tenant_id", tenantId)
        .eq("id", id)
        .select("*")
        .single();
    if (error)
        throw error;
    return data;
}
export async function completeTask(id, tenantId, completedBy, completionNote) {
    return updateTask(id, tenantId, {
        status: "completed",
        completed_at: new Date().toISOString(),
        completed_by: completedBy,
        completion_note: completionNote !== null && completionNote !== void 0 ? completionNote : null,
    });
}
export async function snoozeTask(id, tenantId, until) {
    return updateTask(id, tenantId, {
        status: "snoozed",
        snoozed_until: until,
    });
}
export async function deleteTask(id, tenantId) {
    const supabase = clientFor(tenantId);
    const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq("tenant_id", tenantId)
        .eq("id", id);
    if (error)
        throw error;
}
