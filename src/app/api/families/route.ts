import { NextRequest } from "next/server";
import { z } from "zod";
import { createFamily, listFamilies, type FamilyFilter } from "@data/families";
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
    const filter: FamilyFilter = {
      primary_location_id: url.searchParams.get("primary_location_id") ?? undefined,
      billing_status: url.searchParams.get("billing_status") ?? undefined,
      profile_id: url.searchParams.get("profile_id") ?? undefined,
      referred_by_family_id:
        url.searchParams.get("referred_by_family_id") ?? undefined,
      search: url.searchParams.get("search") ?? undefined,
    };
    const autopay = url.searchParams.get("autopay");
    if (autopay === "true") filter.autopay_enabled = true;
    else if (autopay === "false") filter.autopay_enabled = false;

    const data = await listFamilies(tenantId, filter, parseListQuery(req));
    return ok({ data, count: data.length });
  } catch (err) {
    return serverError(err);
  }
}

const FamilyCreateSchema = z
  .object({
    name: z.string().min(1),
    primary_email: z.string().email().nullable().optional(),
    primary_phone: z.string().nullable().optional(),
    primary_contact_name: z.string().nullable().optional(),
    parent_first_name: z.string().nullable().optional(),
    parent_last_name: z.string().nullable().optional(),
    parent_name: z.string().nullable().optional(),
    primary_location_id: z.string().uuid().nullable().optional(),
    is_military: z.boolean().optional(),
    billing_day: z.number().int().min(1).max(31).nullable().optional(),
    billing_status: z.string().optional(),
    rate_tier: z.number().int().optional(),
    referred_by_family_id: z.string().uuid().nullable().optional(),
    notify_via_email: z.boolean().optional(),
    notify_via_sms: z.boolean().optional(),
    reminder_1hr: z.boolean().optional(),
    reminder_4hr: z.boolean().optional(),
    profile_id: z.string().uuid().nullable().optional(),
  })
  .passthrough();

export async function POST(req: NextRequest) {
  try {
    const tenantId = resolveTenantId(req);
    const body = await readJson(req);
    const parsed = FamilyCreateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid family payload", parsed.error.flatten());
    }
    const row = await createFamily(tenantId, parsed.data);
    return created({ data: row });
  } catch (err) {
    return serverError(err);
  }
}
