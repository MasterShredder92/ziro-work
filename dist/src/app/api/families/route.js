import { z } from "zod";
import { createFamily, listFamilies } from "@data/families";
import { badRequest, created, ok, parseListQuery, readJson, resolveTenantId, serverError, } from "@/lib/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
    var _a, _b, _c, _d, _e;
    try {
        const tenantId = resolveTenantId(req);
        const url = new URL(req.url);
        const filter = {
            primary_location_id: (_a = url.searchParams.get("primary_location_id")) !== null && _a !== void 0 ? _a : undefined,
            billing_status: (_b = url.searchParams.get("billing_status")) !== null && _b !== void 0 ? _b : undefined,
            profile_id: (_c = url.searchParams.get("profile_id")) !== null && _c !== void 0 ? _c : undefined,
            referred_by_family_id: (_d = url.searchParams.get("referred_by_family_id")) !== null && _d !== void 0 ? _d : undefined,
            search: (_e = url.searchParams.get("search")) !== null && _e !== void 0 ? _e : undefined,
        };
        const autopay = url.searchParams.get("autopay");
        if (autopay === "true")
            filter.autopay_enabled = true;
        else if (autopay === "false")
            filter.autopay_enabled = false;
        const data = await listFamilies(tenantId, filter, parseListQuery(req));
        return ok({ data, count: data.length });
    }
    catch (err) {
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
export async function POST(req) {
    try {
        const tenantId = resolveTenantId(req);
        const body = await readJson(req);
        const parsed = FamilyCreateSchema.safeParse(body);
        if (!parsed.success) {
            return badRequest("Invalid family payload", parsed.error.flatten());
        }
        const row = await createFamily(tenantId, parsed.data);
        return created({ data: row });
    }
    catch (err) {
        return serverError(err);
    }
}
