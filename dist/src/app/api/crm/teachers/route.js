var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { z } from "zod";
import { createTeacher, listTeachers, } from "@data/teachers";
import { badRequest, created, ok, readJson, serverError } from "@/lib/http";
import { resolveCRMContext } from "../_context";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
    var _a, _b;
    const resolved = await resolveCRMContext(req, {
        permissions: ["crm.read"],
        minRole: "teacher",
    });
    if ("response" in resolved)
        return resolved.response;
    try {
        const url = new URL(req.url);
        const filter = {
            location_id: (_a = url.searchParams.get("locationId")) !== null && _a !== void 0 ? _a : undefined,
            status: (_b = url.searchParams.get("status")) !== null && _b !== void 0 ? _b : undefined,
        };
        const isActive = url.searchParams.get("isActive");
        if (isActive === "true")
            filter.is_active = true;
        if (isActive === "false")
            filter.is_active = false;
        const data = await listTeachers(resolved.context.tenantId, filter);
        return ok({ data, count: data.length });
    }
    catch (err) {
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
export async function POST(req) {
    var _a;
    const resolved = await resolveCRMContext(req, {
        permissions: ["crm.write"],
        minRole: "director",
    });
    if ("response" in resolved)
        return resolved.response;
    try {
        const body = await readJson(req);
        const parsed = CreateTeacherSchema.safeParse(body);
        if (!parsed.success) {
            return badRequest("Invalid teacher payload", parsed.error.flatten());
        }
        const _b = parsed.data, { first_name, last_name } = _b, rest = __rest(_b, ["first_name", "last_name"]);
        const row = await createTeacher(resolved.context.tenantId, Object.assign({ first_name,
            last_name, instruments: (_a = rest.instruments) !== null && _a !== void 0 ? _a : [] }, rest));
        return created({ data: row });
    }
    catch (err) {
        return serverError(err);
    }
}
