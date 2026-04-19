import type {
  Task,
  TaskInsert,
  TaskUpdate,
} from "@/lib/types/entities";
import { clientFor, applyListOptions, type ListOptions } from "./_client";

const TABLE = "tasks";

export type TaskFilter = {
  status?: string;
  assigned_to?: string;
  assigned_role?: string;
  task_type?: string;
  entity_type?: string;
  entity_id?: string;
  priority?: string;
  location_id?: string;
  due_before?: string;
  due_after?: string;
  includeCompleted?: boolean;
};

export async function listTasks(
  tenantId: string,
  filter?: TaskFilter,
  opts?: ListOptions,
): Promise<Task[]> {
  const supabase = clientFor(tenantId);
  let query = supabase
    .from(TABLE)
    .select("*")
    .eq("tenant_id", tenantId);

  if (filter?.status) {
    query = query.eq("status", filter.status);
  } else if (!filter?.includeCompleted) {
    query = query.neq("status", "completed");
  }
  if (filter?.assigned_to) query = query.eq("assigned_to", filter.assigned_to);
  if (filter?.assigned_role)
    query = query.eq("assigned_role", filter.assigned_role);
  if (filter?.task_type) query = query.eq("task_type", filter.task_type);
  if (filter?.entity_type) query = query.eq("entity_type", filter.entity_type);
  if (filter?.entity_id) query = query.eq("entity_id", filter.entity_id);
  if (filter?.priority) query = query.eq("priority", filter.priority);
  if (filter?.location_id) query = query.eq("location_id", filter.location_id);
  if (filter?.due_before) query = query.lte("due_date", filter.due_before);
  if (filter?.due_after) query = query.gte("due_date", filter.due_after);

  const ordered = applyListOptions(query, {
    orderBy: opts?.orderBy ?? "due_date",
    ascending: opts?.ascending ?? true,
    limit: opts?.limit ?? 200,
    offset: opts?.offset,
  });

  const { data, error } = await ordered;
  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function getTaskById(
  id: string,
  tenantId: string,
): Promise<Task | null> {
  const supabase = clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as Task | null;
}

export async function createTask(
  tenantId: string,
  input: Omit<TaskInsert, "tenant_id">,
): Promise<Task> {
  const supabase = clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ ...input, tenant_id: tenantId })
    .select("*")
    .single();
  if (error) throw error;
  return data as Task;
}

export async function updateTask(
  id: string,
  tenantId: string,
  input: TaskUpdate,
): Promise<Task> {
  const supabase = clientFor(tenantId);
  const patch = { ...input, updated_at: new Date().toISOString() };
  const { data, error } = await supabase
    .from(TABLE)
    .update(patch)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Task;
}

export async function completeTask(
  id: string,
  tenantId: string,
  completedBy: string,
  completionNote?: string,
): Promise<Task> {
  return updateTask(id, tenantId, {
    status: "completed",
    completed_at: new Date().toISOString(),
    completed_by: completedBy,
    completion_note: completionNote ?? null,
  });
}

export async function snoozeTask(
  id: string,
  tenantId: string,
  until: string,
): Promise<Task> {
  return updateTask(id, tenantId, {
    status: "snoozed",
    snoozed_until: until,
  });
}

export async function deleteTask(
  id: string,
  tenantId: string,
): Promise<void> {
  const supabase = clientFor(tenantId);
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", id);
  if (error) throw error;
}
