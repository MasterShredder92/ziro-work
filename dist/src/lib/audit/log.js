import "server-only";
import { getServiceClient } from "@/lib/supabase";
import { getSession } from "@/lib/auth/session";
const g = globalThis;
function tableMissing() {
    return g.__ziro_audit_table_missing === true;
}
function markTableMissing() {
    g.__ziro_audit_table_missing = true;
}
function sanitizePayload(payload) {
    if (!payload)
        return null;
    if (typeof payload !== "object")
        return null;
    try {
        return JSON.parse(JSON.stringify(payload));
    }
    catch (_a) {
        return null;
    }
}
function isMissingTableError(err) {
    if (!err || typeof err !== "object")
        return false;
    const rec = err;
    const code = typeof rec.code === "string" ? rec.code : null;
    const message = typeof rec.message === "string" ? rec.message : "";
    if (code === "42P01")
        return true;
    if (code === "PGRST205")
        return true;
    if (/relation .*audit_logs.* does not exist/i.test(message))
        return true;
    if (/Could not find the table .*audit_logs/i.test(message))
        return true;
    return false;
}
export async function logAudit(event, payload = null) {
    var _a, _b, _c;
    if (!event || typeof event !== "string")
        return;
    if (tableMissing())
        return;
    let session = null;
    try {
        session = await getSession();
    }
    catch (_d) {
        session = null;
    }
    const supabase = getServiceClient();
    const row = {
        event,
        payload: sanitizePayload(payload),
        profile_id: (_a = session === null || session === void 0 ? void 0 : session.userId) !== null && _a !== void 0 ? _a : null,
        tenant_id: (_b = session === null || session === void 0 ? void 0 : session.tenantId) !== null && _b !== void 0 ? _b : null,
        role: (_c = session === null || session === void 0 ? void 0 : session.role) !== null && _c !== void 0 ? _c : null,
        created_at: new Date().toISOString(),
    };
    try {
        const { error } = await supabase.from("audit_logs").insert(row);
        if (error) {
            if (isMissingTableError(error)) {
                markTableMissing();
                return;
            }
            return;
        }
    }
    catch (err) {
        if (isMissingTableError(err))
            markTableMissing();
        return;
    }
}
export async function logAuditWithContext(event, context, payload = null) {
    var _a, _b, _c;
    if (!event || typeof event !== "string")
        return;
    if (tableMissing())
        return;
    const supabase = getServiceClient();
    const row = {
        event,
        payload: sanitizePayload(payload),
        profile_id: (_a = context.profileId) !== null && _a !== void 0 ? _a : null,
        tenant_id: (_b = context.tenantId) !== null && _b !== void 0 ? _b : null,
        role: (_c = context.role) !== null && _c !== void 0 ? _c : null,
        created_at: new Date().toISOString(),
    };
    try {
        const { error } = await supabase.from("audit_logs").insert(row);
        if (error && isMissingTableError(error)) {
            markTableMissing();
        }
    }
    catch (err) {
        if (isMissingTableError(err))
            markTableMissing();
    }
}
