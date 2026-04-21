import { z } from "zod";
import { createStudent, listStudents } from "@data/students";
import { badRequest, created, ok, parseListQuery, readJson, resolveTenantId, serverError, } from "@/lib/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
    var _a, _b, _c, _d, _e, _f;
    try {
        const tenantId = resolveTenantId(req);
        const url = new URL(req.url);
        const filter = {
            family_id: (_a = url.searchParams.get("family_id")) !== null && _a !== void 0 ? _a : undefined,
            teacher_id: (_b = url.searchParams.get("teacher_id")) !== null && _b !== void 0 ? _b : undefined,
            location_id: (_c = url.searchParams.get("location_id")) !== null && _c !== void 0 ? _c : undefined,
            status: (_d = url.searchParams.get("status")) !== null && _d !== void 0 ? _d : undefined,
            instrument: (_e = url.searchParams.get("instrument")) !== null && _e !== void 0 ? _e : undefined,
            enrollment_type: (_f = url.searchParams.get("enrollment_type")) !== null && _f !== void 0 ? _f : undefined,
        };
        const data = await listStudents(tenantId, filter, parseListQuery(req));
        return ok({ data, count: data.length });
    }
    catch (err) {
        return serverError(err);
    }
}
const StudentCreateSchema = z
    .object({
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    email: z.string().email().nullable().optional(),
    phone: z.string().nullable().optional(),
    family_id: z.string().uuid().nullable().optional(),
    teacher_id: z.string().uuid().nullable().optional(),
    location_id: z.string().uuid().nullable().optional(),
    instrument: z.string().nullable().optional(),
    date_of_birth: z.string().nullable().optional(),
    status: z.string().optional(),
    enrollment_type: z.string().nullable().optional(),
    rate_per_session: z.number().optional(),
    sessions_per_month: z.number().optional(),
    blocks_per_week: z.number().optional(),
    notes: z.string().nullable().optional(),
    goals: z.string().nullable().optional(),
    source: z.string().nullable().optional(),
    start_date: z.string().nullable().optional(),
    first_lesson_date: z.string().nullable().optional(),
    intake_submission_id: z.string().uuid().nullable().optional(),
    tags: z.array(z.string()).nullable().optional(),
})
    .passthrough();
export async function POST(req) {
    try {
        const tenantId = resolveTenantId(req);
        const body = await readJson(req);
        const parsed = StudentCreateSchema.safeParse(body);
        if (!parsed.success) {
            return badRequest("Invalid student payload", parsed.error.flatten());
        }
        const row = await createStudent(tenantId, parsed.data);
        return created({ data: row });
    }
    catch (err) {
        return serverError(err);
    }
}
