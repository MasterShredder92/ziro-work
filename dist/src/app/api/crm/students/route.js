import { z } from "zod";
import { createStudent, listStudents } from "@data/students";
import { badRequest, created, ok, readJson, serverError } from "@/lib/http";
import { resolveCRMContext } from "../_context";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
    var _a, _b, _c, _d, _e, _f;
    const resolved = await resolveCRMContext(req, {
        permissions: ["crm.read"],
        minRole: "student",
    });
    if ("response" in resolved)
        return resolved.response;
    try {
        const url = new URL(req.url);
        const filter = {
            family_id: (_a = url.searchParams.get("familyId")) !== null && _a !== void 0 ? _a : undefined,
            teacher_id: (_b = url.searchParams.get("teacherId")) !== null && _b !== void 0 ? _b : undefined,
            location_id: (_c = url.searchParams.get("locationId")) !== null && _c !== void 0 ? _c : undefined,
            status: (_d = url.searchParams.get("status")) !== null && _d !== void 0 ? _d : undefined,
            instrument: (_e = url.searchParams.get("instrument")) !== null && _e !== void 0 ? _e : undefined,
            enrollment_type: (_f = url.searchParams.get("enrollmentType")) !== null && _f !== void 0 ? _f : undefined,
        };
        const data = await listStudents(resolved.context.tenantId, filter);
        return ok({ data, count: data.length });
    }
    catch (err) {
        return serverError(err);
    }
}
const CreateStudentSchema = z
    .object({
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    email: z.string().email().nullable().optional(),
    phone: z.string().nullable().optional(),
    family_id: z.string().uuid().nullable().optional(),
    teacher_id: z.string().uuid().nullable().optional(),
    location_id: z.string().uuid().nullable().optional(),
    status: z.string().optional(),
    instrument: z.string().nullable().optional(),
    source: z.string().nullable().optional(),
})
    .passthrough();
export async function POST(req) {
    const resolved = await resolveCRMContext(req, {
        permissions: ["crm.write"],
        minRole: "director",
    });
    if ("response" in resolved)
        return resolved.response;
    try {
        const body = await readJson(req);
        const parsed = CreateStudentSchema.safeParse(body);
        if (!parsed.success) {
            return badRequest("Invalid student payload", parsed.error.flatten());
        }
        const row = await createStudent(resolved.context.tenantId, parsed.data);
        return created({ data: row });
    }
    catch (err) {
        return serverError(err);
    }
}
