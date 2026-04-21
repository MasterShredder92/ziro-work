import { z } from "zod";
import { listContacts, createContact } from "@data/contacts";
import { badRequest, created, ok, readJson, serverError } from "@/lib/http";
import { resolveCRMContext } from "../_context";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const resolved = await resolveCRMContext(req, {
        permissions: ["crm.read"],
        minRole: "student",
    });
    if ("response" in resolved)
        return resolved.response;
    try {
        const url = new URL(req.url);
        const kindParam = url.searchParams.getAll("kind");
        const filter = {
            kind: (kindParam.length
                ? kindParam
                : undefined),
            familyId: (_a = url.searchParams.get("familyId")) !== null && _a !== void 0 ? _a : undefined,
            teacherId: (_b = url.searchParams.get("teacherId")) !== null && _b !== void 0 ? _b : undefined,
            locationId: (_c = url.searchParams.get("locationId")) !== null && _c !== void 0 ? _c : undefined,
            status: (_d = url.searchParams.get("status")) !== null && _d !== void 0 ? _d : undefined,
            stage: (_e = url.searchParams.get("stage")) !== null && _e !== void 0 ? _e : undefined,
            tag: (_f = url.searchParams.get("tag")) !== null && _f !== void 0 ? _f : undefined,
            search: (_g = url.searchParams.get("search")) !== null && _g !== void 0 ? _g : undefined,
            includeArchived: url.searchParams.get("includeArchived") === "true" || undefined,
        };
        const limit = Math.min(Math.max(Number((_h = url.searchParams.get("limit")) !== null && _h !== void 0 ? _h : "200"), 1), 1000);
        const data = await listContacts(resolved.context.tenantId, filter, limit);
        return ok({ data, count: data.length });
    }
    catch (err) {
        return serverError(err);
    }
}
const CreateContactSchema = z.object({
    kind: z.enum(["lead", "student", "family", "teacher"]),
    firstName: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
    email: z.string().email().nullable().optional(),
    phone: z.string().nullable().optional(),
    familyId: z.string().uuid().nullable().optional(),
    locationId: z.string().uuid().nullable().optional(),
    source: z.string().nullable().optional(),
    tags: z.array(z.string()).nullable().optional(),
    notes: z.string().nullable().optional(),
});
export async function POST(req) {
    const resolved = await resolveCRMContext(req, {
        permissions: ["crm.write"],
        minRole: "director",
    });
    if ("response" in resolved)
        return resolved.response;
    try {
        const body = await readJson(req);
        const parsed = CreateContactSchema.safeParse(body);
        if (!parsed.success) {
            return badRequest("Invalid contact payload", parsed.error.flatten());
        }
        const row = await createContact(resolved.context.tenantId, parsed.data);
        return created({ data: row });
    }
    catch (err) {
        return serverError(err);
    }
}
