import { NextRequest } from "next/server";
import { z } from "zod";
import {
  createTeacher,
  listTeachers,
  type ListTeachersFilter,
} from "@data/teachers";
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
    const filter: ListTeachersFilter = {
      location_id: url.searchParams.get("locationId") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
    };
    const isActive = url.searchParams.get("isActive");
    if (isActive === "true") filter.is_active = true;
    if (isActive === "false") filter.is_active = false;
    const data = await listTeachers(resolved.context.tenantId, filter);
    return ok({ data, count: data.length });
  } catch (err) {
    return serverError(err);
  }
}

const CreateTeacherSchema = z
  .object({
    first_name: z.string().nullable().optional(),
    last_name: z.string().nullable().optional(),
    display_name: z.string().nullable().optional(),
    email: z.string().email().nullable().optional(),
    phone: z.string().nullable().optional(),
    instruments: z.array(z.string()).optional(),
    status: z.string().optional(),
    is_active: z.boolean().optional(),
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
    const parsed = CreateTeacherSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid teacher payload", parsed.error.flatten());
    }
    const row = await createTeacher(resolved.context.tenantId, {
      instruments: parsed.data.instruments ?? [],
      ...parsed.data,
    });
    return created({ data: row });
  } catch (err) {
    return serverError(err);
  }
}
