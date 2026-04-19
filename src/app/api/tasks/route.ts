import { NextRequest } from "next/server";
import { z } from "zod";
import { createTask, listTasks, type TaskFilter } from "@data/tasks";
import {
  badRequest,
  created,
  ok,
  parseListQuery,
  readJson,
  resolveTenantId,
  serverError,
} from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const tenantId = resolveTenantId(req);
    const url = new URL(req.url);
    const filter: TaskFilter = {
      status: url.searchParams.get("status") ?? undefined,
      assigned_to: url.searchParams.get("assigned_to") ?? undefined,
      assigned_role: url.searchParams.get("assigned_role") ?? undefined,
      task_type: url.searchParams.get("task_type") ?? undefined,
      entity_type: url.searchParams.get("entity_type") ?? undefined,
      entity_id: url.searchParams.get("entity_id") ?? undefined,
      priority: url.searchParams.get("priority") ?? undefined,
      location_id: url.searchParams.get("location_id") ?? undefined,
      due_before: url.searchParams.get("due_before") ?? undefined,
      due_after: url.searchParams.get("due_after") ?? undefined,
      includeCompleted:
        url.searchParams.get("include_completed") === "true" ? true : undefined,
    };
    const data = await listTasks(tenantId, filter, parseListQuery(req));
    return ok({ data, count: data.length });
  } catch (err) {
    return serverError(err);
  }
}

const TaskCreateSchema = z
  .object({
    title: z.string().min(1),
    task_type: z.string().min(1),
    description: z.string().nullable().optional(),
    status: z.string().optional(),
    priority: z.string().optional(),
    assigned_to: z.string().uuid().nullable().optional(),
    assigned_role: z.string().nullable().optional(),
    entity_type: z.string().nullable().optional(),
    entity_id: z.string().uuid().nullable().optional(),
    entity_name: z.string().nullable().optional(),
    location_id: z.string().uuid().nullable().optional(),
    due_date: z.string().nullable().optional(),
    dedup_key: z.string().nullable().optional(),
    recurring: z.string().nullable().optional(),
    created_by: z.string().uuid().nullable().optional(),
    created_by_role: z.string().nullable().optional(),
  })
  .passthrough();

export async function POST(req: NextRequest) {
  try {
    const tenantId = resolveTenantId(req);
    const body = await readJson(req);
    const parsed = TaskCreateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid task payload", parsed.error.flatten());
    }
    const row = await createTask(tenantId, parsed.data);
    return created({ data: row });
  } catch (err) {
    return serverError(err);
  }
}
