import { assertTenantAccess, requirePermission, } from "@/lib/auth/guards";
import { assertLocationAllowed, resolveUserLocationAccess, } from "@/lib/auth/locationAccess";
export function forbidden() {
    return new Response(JSON.stringify({ error: "FORBIDDEN" }), {
        status: 403,
        headers: { "content-type": "application/json" },
    });
}
export function conflict(details) {
    return new Response(JSON.stringify({ error: "SCHEDULE_CONFLICT", details }), {
        status: 409,
        headers: { "content-type": "application/json" },
    });
}
export async function readJsonSafe(req) {
    try {
        return (await req.json());
    }
    catch (_a) {
        return null;
    }
}
export function resolveTenantFromRequest(req, session) {
    const header = req.headers.get("x-tenant-id");
    if (header && header.trim())
        return header.trim();
    const url = new URL(req.url);
    const q = url.searchParams.get("tenantId");
    if (q && q.trim())
        return q.trim();
    return session.tenantId;
}
export async function withScheduleAccess(req, perm) {
    const session = await requirePermission(perm)();
    const tenantId = resolveTenantFromRequest(req, session);
    await assertTenantAccess(tenantId);
    const url = new URL(req.url);
    const preferredLocationId = url.searchParams.get("locationId");
    const locationAccess = await resolveUserLocationAccess({
        session: Object.assign(Object.assign({}, session), { tenantId }),
        preferredLocationId,
        autoRepairProfileLocation: true,
    });
    return { session, tenantId, locationAccess };
}
export function resolveRequestedLocationId(req, access, options) {
    var _a;
    const paramName = (_a = options === null || options === void 0 ? void 0 : options.paramName) !== null && _a !== void 0 ? _a : "locationId";
    const allowFallback = (options === null || options === void 0 ? void 0 : options.allowFallback) !== false;
    const requested = new URL(req.url).searchParams.get(paramName);
    if (requested && requested.trim().length > 0) {
        return assertLocationAllowed(access, requested);
    }
    if (allowFallback) {
        return access.selectedLocationId;
    }
    if (options === null || options === void 0 ? void 0 : options.required)
        throw new Error("FORBIDDEN");
    return null;
}
export function parseEventInput(body) {
    if (!body || typeof body !== "object")
        return null;
    const b = body;
    const out = {};
    const assignString = (key, value) => {
        if (typeof value === "string")
            out[key] = value;
        else if (value === null)
            out[key] = null;
    };
    if (typeof b.title === "string")
        out.title = b.title;
    if (typeof b.kind === "string")
        out.kind = b.kind;
    if (typeof b.status === "string")
        out.status = b.status;
    assignString("teacherId", b.teacherId);
    assignString("studentId", b.studentId);
    assignString("familyId", b.familyId);
    assignString("roomId", b.roomId);
    assignString("locationId", b.locationId);
    if (typeof b.startTime === "string")
        out.startTime = b.startTime;
    if (typeof b.endTime === "string")
        out.endTime = b.endTime;
    if (typeof b.recurrenceId === "string" || b.recurrenceId === null)
        out.recurrenceId = b.recurrenceId;
    if (typeof b.notes === "string" || b.notes === null)
        out.notes = b.notes;
    if (typeof b.color === "string" || b.color === null)
        out.color = b.color;
    if (typeof b.createdBy === "string" || b.createdBy === null)
        out.createdBy = b.createdBy;
    return out;
}
