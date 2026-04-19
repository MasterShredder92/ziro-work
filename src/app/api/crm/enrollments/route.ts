import { NextRequest } from "next/server";
import { z } from "zod";
import { enrollStudent, listEnrollmentsFor } from "@/lib/crm";
import { badRequest, created, ok, readJson, serverError } from "@/lib/http";
import { resolveCRMContext } from "../_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.read"],
    minRole: "teacher",
  });
  if ("response" in resolved) return resolved.response;
  try {
    const url = new URL(req.url);
    const data = await listEnrollmentsFor(resolved.context.tenantId, {
      student_id: url.searchParams.get("studentId") ?? undefined,
      teacher_id: url.searchParams.get("teacherId") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
    });
    return ok({ data, count: data.length });
  } catch (err) {
    return serverError(err);
  }
}

const EnrollSchema = z.object({
  studentId: z.string().uuid(),
  teacherId: z.string().uuid(),
  startDate: z.string().optional(),
  status: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.write"],
    minRole: "director",
  });
  if ("response" in resolved) return resolved.response;
  try {
    const body = await readJson(req);
    const parsed = EnrollSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid enrollment payload", parsed.error.flatten());
    }
    const row = await enrollStudent(resolved.context.tenantId, parsed.data);
    return created({ data: row });
  } catch (err) {
    return serverError(err);
  }
}
