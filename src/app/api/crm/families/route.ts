import { NextRequest } from "next/server";
import { z } from "zod";
import { createFamily, listFamilies, type FamilyFilter } from "@data/families";
import { badRequest, created, ok, readJson, serverError } from "@/lib/http";
import { resolveCRMContext } from "../_context";
import { clientFor } from "@data/_client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.read"],
    minRole: "family",
  });
  if ("response" in resolved) return resolved.response;
  try {
    const url = new URL(req.url);
    const filter: FamilyFilter = {
      primary_location_id: url.searchParams.get("locationId") ?? undefined,
      billing_status: url.searchParams.get("status") ?? undefined,
      search: url.searchParams.get("search") ?? undefined,
    };
    const tenantId = resolved.context.tenantId;
    const data = await listFamilies(tenantId, filter);

    if (data.length > 0) {
      const supabase = clientFor(tenantId);
      const familyIds = data.map((f) => f.id);
      const GHOST_LOC = "3a7a997c-7c93-44ef-aec5-a6d706967e5b";
      // Pull from schedules SSOT — join students + teachers for Name • Instrument • Teacher display
      const { data: scheduleRows } = await supabase
        .from("schedules")
        .select(`
          id,
          instrument,
          location_id,
          student:students!schedules_student_id_fkey (
            id, family_id, first_name, last_name, display_name
          ),
          teacher:teachers!schedules_teacher_id_fkey (
            first_name, last_name, display_name
          )
        `)
        .eq("tenant_id", tenantId)
        .eq("status", "active")
        .neq("location_id", GHOST_LOC);

      const countMap: Record<string, number> = {};
      const studentsMap: Record<string, {
        id: string;
        first_name?: string | null;
        last_name?: string | null;
        instrument?: string | null;
        status?: string | null;
        teacher_name?: string | null;
      }[]> = {};
      const seenStudents = new Set<string>();
      for (const row of scheduleRows ?? []) {
        const s = Array.isArray(row.student) ? row.student[0] : row.student as { id: string; family_id?: string | null; first_name?: string | null; last_name?: string | null; display_name?: string | null } | null;
        if (!s?.family_id || !familyIds.includes(s.family_id)) continue;
        // Deduplicate by student per family
        const key = `${s.family_id}:${s.id}`;
        if (seenStudents.has(key)) continue;
        seenStudents.add(key);
        countMap[s.family_id] = (countMap[s.family_id] ?? 0) + 1;
        if (!studentsMap[s.family_id]) studentsMap[s.family_id] = [];
        const t = Array.isArray(row.teacher) ? row.teacher[0] : row.teacher as { first_name?: string | null; last_name?: string | null; display_name?: string | null } | null;
        const teacherName = t
          ? (t.display_name ?? [t.first_name, t.last_name].filter(Boolean).join(" ") ?? null)
          : null;
        studentsMap[s.family_id].push({
          id: s.id,
          first_name: s.first_name,
          last_name: s.last_name,
          instrument: row.instrument ?? null,
          status: "active",
          teacher_name: teacherName,
        });
      }

      const enriched = data.map((f) => {
        const row = f as Record<string, unknown>;
        return {
          ...f,
          student_count: countMap[f.id] ?? 0,
          students: studentsMap[f.id] ?? [],
          balance_owed: (row.balance as number) ?? 0,
          lifetime_paid: row.lifetime_paid_cents
            ? (row.lifetime_paid_cents as number) / 100
            : 0,
        };
      });
      return ok({ data: enriched, count: enriched.length });
    }

    return ok({ data, count: data.length });
  } catch (err) {
    return serverError(err);
  }
}

const CreateFamilySchema = z
  .object({
    name: z.string().min(1),
    primary_email: z.string().email().nullable().optional(),
    primary_phone: z.string().nullable().optional(),
    primary_location_id: z.string().uuid().nullable().optional(),
    parent_first_name: z.string().nullable().optional(),
    parent_last_name: z.string().nullable().optional(),
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
    const parsed = CreateFamilySchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid family payload", parsed.error.flatten());
    }
    const row = await createFamily(resolved.context.tenantId, parsed.data);
    return created({ data: row });
  } catch (err) {
    return serverError(err);
  }
}
