/**
 * Billing OS integration for CRM entities.
 * Surfaces family billing relationships without mutating billing rows.
 */
import { clientFor } from "@data/_client";
export async function getFamilyBillingSummary(tenantId, familyId) {
    var _a, _b, _c;
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
        .from("families")
        .select("id, billing_status, balance, overdue_balance_cents, autopay_enabled, lifetime_paid_cents")
        .eq("tenant_id", tenantId)
        .eq("id", familyId)
        .maybeSingle();
    if (error)
        throw error;
    if (!data)
        return null;
    const row = data;
    return {
        familyId: row.id,
        billingStatus: row.billing_status,
        balanceCents: Math.round(((_a = row.balance) !== null && _a !== void 0 ? _a : 0) * 100),
        overdueCents: (_b = row.overdue_balance_cents) !== null && _b !== void 0 ? _b : 0,
        autopayEnabled: Boolean(row.autopay_enabled),
        lifetimePaidCents: (_c = row.lifetime_paid_cents) !== null && _c !== void 0 ? _c : 0,
    };
}
export async function listStudentsForFamily(tenantId, familyId) {
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
        .from("students")
        .select("id, first_name, last_name, status, instrument, location_id, rate_per_session, total_paid, first_teacher_name, last_teacher_name, is_military")
        .eq("tenant_id", tenantId)
        .eq("family_id", familyId);
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : []).map((raw) => {
        var _a, _b, _c, _d, _e, _f, _g;
        const r = raw;
        return {
            id: r.id,
            name: `${(_a = r.first_name) !== null && _a !== void 0 ? _a : ""} ${(_b = r.last_name) !== null && _b !== void 0 ? _b : ""}`.trim() || "Unnamed",
            status: (_c = r.status) !== null && _c !== void 0 ? _c : null,
            instrument: (_d = r.instrument) !== null && _d !== void 0 ? _d : null,
            location_id: (_e = r.location_id) !== null && _e !== void 0 ? _e : null,
            rate_per_session: typeof r.rate_per_session === "number" ? r.rate_per_session : null,
            total_paid: typeof r.total_paid === "number" ? r.total_paid : null,
            teacher_label: (_g = (_f = r.last_teacher_name) !== null && _f !== void 0 ? _f : r.first_teacher_name) !== null && _g !== void 0 ? _g : null,
            is_military: Boolean(r.is_military),
        };
    });
}
