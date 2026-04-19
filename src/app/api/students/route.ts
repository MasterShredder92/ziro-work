import { NextRequest } from "next/server";
import { z } from "zod";
import { createStudent, listStudents, type StudentFilter } from "@data/students";
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
    const filter: StudentFilter = {
      family_id: url.searchParams.get("family_id") ?? undefined,
      teacher_id: url.searchParams.get("teacher_id") ?? undefined,
      location_id: url.searchParams.get("location_id") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      instrument: url.searchParams.get("instrument") ?? undefined,
      enrollment_type: url.searchParams.get("enrollment_type") ?? undefined,
    };
    const data = await listStudents(tenantId, filter, parseListQuery(req));
    return ok({ data, count: data.length });
  } catch (err) {
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

export async function POST(req: NextRequest) {
  try {
    const tenantId = resolveTenantId(req);
    const body = await readJson(req);
    const parsed = StudentCreateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid student payload", parsed.error.flatten());
    }
    const row = await createStudent(tenantId, parsed.data);
    return created({ data: row });
  } catch (err) {
    return serverError(err);
  }
}
