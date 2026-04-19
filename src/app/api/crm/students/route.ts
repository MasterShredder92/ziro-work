import { NextRequest } from "next/server";
import { z } from "zod";
import { createStudent, listStudents, type StudentFilter } from "@data/students";
import { badRequest, created, ok, readJson, serverError } from "@/lib/http";
import { resolveCRMContext } from "../_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.read"],
    minRole: "student",
  });
  if ("response" in resolved) return resolved.response;
  try {
    const url = new URL(req.url);
    const filter: StudentFilter = {
      family_id: url.searchParams.get("familyId") ?? undefined,
      teacher_id: url.searchParams.get("teacherId") ?? undefined,
      location_id: url.searchParams.get("locationId") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      instrument: url.searchParams.get("instrument") ?? undefined,
      enrollment_type: url.searchParams.get("enrollmentType") ?? undefined,
    };
    const data = await listStudents(resolved.context.tenantId, filter);
    return ok({ data, count: data.length });
  } catch (err) {
    return serverError(err);
  }
}

const CreateStudentSchema = z
  .object({
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    email: z.string().email().nullable().optional(),
    phone: z.string().nullable().optional(),
    family_id: z.string().uuid().nullable().optional(),
    teacher_id: z.string().uuid().nullable().optional(),
    location_id: z.string().uuid().nullable().optional(),
    status: z.string().optional(),
    instrument: z.string().nullable().optional(),
    source: z.string().nullable().optional(),
  })
  .passthrough();

export async function POST(req: NextRequest) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.write"],
    minRole: "director",
  });
  if ("response" in resolved) return resolved.response;
  try {
    const body = await readJson(req);
    const parsed = CreateStudentSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid student payload", parsed.error.flatten());
    }
    const row = await createStudent(resolved.context.tenantId, parsed.data);
    return created({ data: row });
  } catch (err) {
    return serverError(err);
  }
}
