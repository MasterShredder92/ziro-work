import { NextRequest } from "next/server";
import { z } from "zod";
import { createFamily, listFamilies, type FamilyFilter } from "@data/families";
import { badRequest, created, ok, readJson, serverError } from "@/lib/http";
import { resolveCRMContext } from "../_context";

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
    const data = await listFamilies(resolved.context.tenantId, filter);
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
