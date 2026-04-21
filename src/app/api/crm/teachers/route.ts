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
    first_name: z.string(),
    last_name: z.string(),
    display_name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
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

    const { first_name, last_name, ...rest } = parsed.data;

    const row = await createTeacher(resolved.context.tenantId, {
      first_name,
      last_name,
      instruments: rest.instruments ?? [],
      ...rest,
    } as any);
    
    return created({ data: row });
  } catch (err) {
    return serverError(err);
  }
}
