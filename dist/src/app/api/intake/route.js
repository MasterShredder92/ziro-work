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
import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000001";
function serializeUnknownError(err) {
    if (err instanceof Error) {
        return {
            name: err.name,
            message: err.message,
            stack: err.stack,
            code: err.code,
            details: err.details,
            hint: err.hint,
        };
    }
    if (typeof err === "string")
        return { message: err };
    if (err && typeof err === "object") {
        const e = err;
        return {
            name: typeof e.name === "string" ? e.name : undefined,
            message: typeof e.message === "string" ? e.message : "Unknown error",
            stack: typeof e.stack === "string" ? e.stack : undefined,
            code: typeof e.code === "string" ? e.code : undefined,
            details: typeof e.details === "string" ? e.details : undefined,
            hint: typeof e.hint === "string" ? e.hint : undefined,
        };
    }
    return { message: "Unknown error" };
}
function isMissingTableError(err) {
    const e = err;
    const code = typeof (e === null || e === void 0 ? void 0 : e.code) === "string" ? e.code : undefined;
    const msg = typeof (e === null || e === void 0 ? void 0 : e.message) === "string" ? e.message : "";
    const details = typeof (e === null || e === void 0 ? void 0 : e.details) === "string" ? e.details : "";
    // Postgres: undefined_table
    if (code === "42P01")
        return true;
    // PostgREST error message variants
    return (/relation .* does not exist/i.test(msg) ||
        /does not exist/i.test(details) ||
        /undefined_table/i.test(msg));
}
async function logStructuredError(args) {
    var _a;
    const error = serializeUnknownError(args.err);
    const payload = {
        event: args.event,
        error,
        context: (_a = args.context) !== null && _a !== void 0 ? _a : {},
        occurred_at: new Date().toISOString(),
    };
    console.error("[intake] error", payload);
    // Best-effort: insert only if `error_logs` exists (no schema changes allowed).
    try {
        const res = await args.supabase.from("error_logs").insert({
            event: payload.event,
            error: payload.error,
            context: payload.context,
            occurred_at: payload.occurred_at,
        });
        if (res.error && isMissingTableError(res.error))
            return;
    }
    catch (e) {
        if (isMissingTableError(e))
            return;
    }
}
function asOptionalTrimmedString(v) {
    if (typeof v !== "string")
        return null;
    const s = v.trim();
    return s.length ? s : null;
}
function isValidEmail(email) {
    // Intentionally simple: reject obvious invalids without being overly strict.
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function normalizePhone(phone) {
    return phone.replace(/[^\d+]/g, "").slice(0, 32);
}
async function readJson(req) {
    try {
        return await req.json();
    }
    catch (_a) {
        return null;
    }
}
function pickRequestMeta(req) {
    var _a;
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = ((_a = forwardedFor === null || forwardedFor === void 0 ? void 0 : forwardedFor.split(",")[0]) === null || _a === void 0 ? void 0 : _a.trim()) ||
        req.headers.get("x-real-ip") ||
        null;
    return {
        ip,
        userAgent: req.headers.get("user-agent"),
        referer: req.headers.get("referer"),
        origin: req.headers.get("origin"),
    };
}
function validateAndNormalize(body) {
    if (!body || typeof body !== "object") {
        return { ok: false, error: "Expected JSON object body." };
    }
    const b = body;
    const name = asOptionalTrimmedString(b.name);
    const emailRaw = asOptionalTrimmedString(b.email);
    const phoneRaw = asOptionalTrimmedString(b.phone);
    const location = asOptionalTrimmedString(b.location);
    const message = asOptionalTrimmedString(b.message);
    const source = asOptionalTrimmedString(b.source);
    const email = emailRaw ? emailRaw.toLowerCase() : null;
    if (email && !isValidEmail(email)) {
        return { ok: false, error: "Invalid email." };
    }
    const phone = phoneRaw ? normalizePhone(phoneRaw) : null;
    if (!name && !email && !phone) {
        return { ok: false, error: "Provide at least one of: name, email, phone." };
    }
    // Keep payload sizes bounded.
    if (name && name.length > 200)
        return { ok: false, error: "name too long." };
    if (email && email.length > 254)
        return { ok: false, error: "email too long." };
    if (phone && phone.length > 32)
        return { ok: false, error: "phone too long." };
    if (location && location.length > 200)
        return { ok: false, error: "location too long." };
    if (source && source.length > 200)
        return { ok: false, error: "source too long." };
    if (message && message.length > 4000)
        return { ok: false, error: "message too long." };
    return {
        ok: true,
        value: {
            tenantId: DEFAULT_TENANT_ID,
            name,
            email,
            phone,
            location,
            message,
            source,
        },
    };
}
async function insertIntakeLog(args) {
    const now = new Date().toISOString();
    const baseRow = {
        tenant_id: args.tenantId,
        name: args.lead.name,
        email: args.lead.email,
        phone: args.lead.phone,
        location: args.lead.location,
        message: args.lead.message,
        source: args.lead.source,
        ip: args.meta.ip,
        user_agent: args.meta.userAgent,
        referer: args.meta.referer,
        origin: args.meta.origin,
        raw_payload: args.rawPayload,
        created_at: now,
    };
    // Because `intake_logs` is legacy and we’re not allowed to change schemas,
    // attempt a rich insert first, then fall back to minimal rows if columns differ.
    let attempt1Err = null;
    try {
        const attempt1 = await args.supabase.from("intake_logs").insert(baseRow);
        if (!attempt1.error)
            return;
        attempt1Err = attempt1.error;
    }
    catch (e) {
        attempt1Err = e;
    }
    let attempt2Err = null;
    try {
        const attempt2 = await args.supabase.from("intake_logs").insert({
            tenant_id: args.tenantId,
            raw_payload: args.rawPayload,
            created_at: now,
        });
        if (!attempt2.error)
            return;
        attempt2Err = attempt2.error;
    }
    catch (e) {
        attempt2Err = e;
    }
    let attempt3Err = null;
    try {
        const attempt3 = await args.supabase.from("intake_logs").insert({
            raw_payload: args.rawPayload,
            created_at: now,
        });
        if (!attempt3.error)
            return;
        attempt3Err = attempt3.error;
    }
    catch (e) {
        attempt3Err = e;
    }
    // Surface the first error, but include the fallbacks in the log for debugging.
    throw new Error(`intake_logs insert failed: ${serializeUnknownError(attempt1Err).message} (fallbacks: ${serializeUnknownError(attempt2Err).message} | ${serializeUnknownError(attempt3Err).message})`);
}
async function insertLegacyLead(args) {
    const now = new Date().toISOString();
    const row = {
        tenant_id: args.tenantId,
        name: args.lead.name,
        email: args.lead.email,
        phone: args.lead.phone,
        location: args.lead.location,
        message: args.lead.message,
        source: args.lead.source,
        created_at: now,
    };
    try {
        const { error } = await args.supabase.from("leads").insert(row);
        if (error)
            throw error;
    }
    catch (err) {
        throw new Error(`leads insert failed: ${serializeUnknownError(err).message}`);
    }
}
export async function POST(req) {
    const rawPayload = await readJson(req);
    const meta = pickRequestMeta(req);
    console.log("[intake] request", {
        ip: meta.ip,
        userAgent: meta.userAgent,
        origin: meta.origin,
        referer: meta.referer,
        rawPayload,
    });
    const parsed = validateAndNormalize(rawPayload);
    if (!parsed.ok) {
        return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    }
    const _a = parsed.value, { tenantId } = _a, lead = __rest(_a, ["tenantId"]);
    const supabase = getServiceClient();
    try {
        await insertIntakeLog({ supabase, tenantId, lead, meta, rawPayload });
        await insertLegacyLead({ supabase, tenantId, lead });
        return NextResponse.json({ success: true });
    }
    catch (err) {
        await logStructuredError({
            supabase,
            event: "api.intake.POST",
            err,
            context: {
                tenantId,
                ip: meta.ip,
                userAgent: meta.userAgent,
                origin: meta.origin,
                referer: meta.referer,
                lead,
            },
        });
        return NextResponse.json({ success: false, error: serializeUnknownError(err).message }, { status: 500 });
    }
}
