import { z } from "zod";
import { createTask, listTasks } from "@data/tasks";
import { badRequest, created, ok, parseListQuery, readJson, resolveTenantId, serverError, } from "@/lib/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    try {
        const tenantId = resolveTenantId(req);
        const url = new URL(req.url);
        const filter = {
            status: (_a = url.searchParams.get("status")) !== null && _a !== void 0 ? _a : undefined,
            assigned_to: (_b = url.searchParams.get("assigned_to")) !== null && _b !== void 0 ? _b : undefined,
            assigned_role: (_c = url.searchParams.get("assigned_role")) !== null && _c !== void 0 ? _c : undefined,
            task_type: (_d = url.searchParams.get("task_type")) !== null && _d !== void 0 ? _d : undefined,
            entity_type: (_e = url.searchParams.get("entity_type")) !== null && _e !== void 0 ? _e : undefined,
            entity_id: (_f = url.searchParams.get("entity_id")) !== null && _f !== void 0 ? _f : undefined,
            priority: (_g = url.searchParams.get("priority")) !== null && _g !== void 0 ? _g : undefined,
            location_id: (_h = url.searchParams.get("location_id")) !== null && _h !== void 0 ? _h : undefined,
            due_before: (_j = url.searchParams.get("due_before")) !== null && _j !== void 0 ? _j : undefined,
            due_after: (_k = url.searchParams.get("due_after")) !== null && _k !== void 0 ? _k : undefined,
            includeCompleted: url.searchParams.get("include_completed") === "true" ? true : undefined,
        };
        const data = await listTasks(tenantId, filter, parseListQuery(req));
        return ok({ data, count: data.length });
    }
    catch (err) {
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
export async function POST(req) {
    try {
        const tenantId = resolveTenantId(req);
        const body = await readJson(req);
        const parsed = TaskCreateSchema.safeParse(body);
        if (!parsed.success) {
            return badRequest("Invalid task payload", parsed.error.flatten());
        }
        const row = await createTask(tenantId, parsed.data);
        return created({ data: row });
    }
    catch (err) {
        return serverError(err);
    }
}
