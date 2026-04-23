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
      const { data: students } = await supabase
        .from("students")
        .select("id, family_id, instrument, status")
        .eq("tenant_id", tenantId)
        .in("family_id", familyIds);

      const countMap: Record<string, number> = {};
      const studentsMap: Record<string, { instrument?: string | null; status?: string | null }[]> = {};
      for (const s of students ?? []) {
        if (!s.family_id) continue;
        countMap[s.family_id] = (countMap[s.family_id] ?? 0) + 1;
        if (!studentsMap[s.family_id]) studentsMap[s.family_id] = [];
        studentsMap[s.family_id].push({ instrument: s.instrument, status: s.status });
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
