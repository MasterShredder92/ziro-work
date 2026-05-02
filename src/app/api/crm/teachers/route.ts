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

    // Optionally enrich each teacher with their teacher_locations rows so the UI
    // can filter dropdowns by location without an N+1 fetch.
    if (url.searchParams.get("include_locations") === "true" && data.length > 0) {
      const { getServiceClient } = await import("@/lib/supabase");
      const db = getServiceClient();
      const ids = data.map((t: { id: string }) => t.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: tlRows } = await (db as any)
        .from("teacher_locations")
        .select("teacher_id, location_id, is_regular, can_sub")
        .in("teacher_id", ids);
      const byId: Record<string, Array<{ location_id: string; is_regular: boolean; can_sub: boolean }>> = {};
      for (const r of (tlRows ?? []) as Array<{ teacher_id: string; location_id: string; is_regular: boolean; can_sub: boolean }>) {
        (byId[r.teacher_id] ||= []).push({ location_id: r.location_id, is_regular: r.is_regular, can_sub: r.can_sub });
      }
      const enriched = (data as Array<Record<string, unknown>>).map((t) => ({
        ...t,
        teacher_locations: byId[(t as { id: string }).id] ?? [],
      }));
      return ok({ data: enriched, count: enriched.length });
    }

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
