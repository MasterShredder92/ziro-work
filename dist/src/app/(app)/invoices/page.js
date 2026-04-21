import { jsx as _jsx } from "react/jsx-runtime";
import { getCRMTenantId } from "../crm/_tenant";
import { getServiceClient } from "@/lib/supabase";
import { InvoicesClient } from "./_client";
export const dynamic = "force-dynamic";
// Square location ID → display info
const SQ_LOCATION_MAP = {};
const LOCATIONS = [
    { id: "f7b52dd5-12ee-437f-9c60-f8adf454ac31", name: "Bellevue", color: "#7C3AED" },
    { id: "40c67ffc-91b5-46a9-94bd-6ddffdfb7638", name: "Gretna", color: "#16A34A" },
    { id: "cebd97d4-c241-4de2-8ade-49e5cc0070d5", name: "Elkhorn", color: "#0EA5E9" },
    { id: "d48229c1-b70a-4d29-893e-5079887dab76", name: "Omaha", color: "#DC2626" },
];
function sumField(rows, field) {
    return rows.reduce((s, r) => { var _a; return s + ((_a = r[field]) !== null && _a !== void 0 ? _a : 0); }, 0);
}
export default async function InvoicesPage({ searchParams, }) {
    var _a, _b, _c, _d, _e, _f, _g;
    const tenantId = await getCRMTenantId();
    const db = getServiceClient();
    const params = (_a = (await searchParams)) !== null && _a !== void 0 ? _a : {};
    const page = Math.max(1, parseInt((_b = params.page) !== null && _b !== void 0 ? _b : "1", 10));
    const pageSize = 100;
    const offset = (page - 1) * pageSize;
    // Month-block navigation: offset from current month (0 = current, -1 = prev, +1 = next, +2 = month after next)
    const now = new Date();
    const monthOffset = parseInt((_c = params.month_offset) !== null && _c !== void 0 ? _c : "0", 10);
    const targetYear = now.getFullYear();
    const targetMonth = now.getMonth() + monthOffset; // JS handles overflow correctly
    const viewStart = new Date(targetYear, targetMonth, 1).toISOString().split("T")[0];
    const viewEnd = new Date(targetYear, targetMonth + 1, 0).toISOString().split("T")[0];
    // For billing metrics bar — always current + next month
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split("T")[0];
    const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString().split("T")[0];
    // Month label for display
    const viewLabel = new Date(targetYear, targetMonth, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const today = now.toISOString().split("T")[0];
    // ── Filtered invoice list ──────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = db
        .from("square_invoices_fact")
        .select("id,family_id,status,amount_cents,invoice_number,due_date,paid_at,square_created_at,square_location_id,customer_email,customer_name,requested_amount,amount_paid_cents,invoice_date,recurring_series_id", { count: "exact" })
        .eq("tenant_id", tenantId)
        .gte("due_date", viewStart)
        .lte("due_date", viewEnd)
        .order("due_date", { ascending: false })
        .range(offset, offset + pageSize - 1);
    if (params.status && params.status !== "all")
        query = query.eq("status", params.status.toUpperCase());
    if (params.location_id)
        query = query.eq("square_location_id", params.location_id);
    if ((_d = params.search) === null || _d === void 0 ? void 0 : _d.trim()) {
        const q = params.search.trim();
        query = query.or(`customer_name.ilike.%${q}%,customer_email.ilike.%${q}%,invoice_number.ilike.%${q}%`);
    }
    const { data: invoices, count } = await query;
    // ── Billing metrics — fetch all invoices for current + next month ──────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: allMetricRows } = await db
        .from("square_invoices_fact")
        .select("status,amount_cents,requested_amount,amount_paid_cents,due_date,paid_at,square_location_id")
        .eq("tenant_id", tenantId)
        .gte("due_date", thisMonthStart)
        .lte("due_date", nextMonthEnd)
        .limit(10000);
    const metricRows = allMetricRows !== null && allMetricRows !== void 0 ? allMetricRows : [];
    // Build square_location_id → location info from the locations table directly
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: locRows } = await db
        .from("locations")
        .select("id,name,color,square_location_id")
        .eq("tenant_id", tenantId);
    const sqToLocation = {};
    for (const loc of (locRows !== null && locRows !== void 0 ? locRows : [])) {
        if (loc.square_location_id) {
            sqToLocation[loc.square_location_id] = { id: loc.id, name: loc.name, color: loc.color };
        }
    }
    // Build per-location metrics
    function metricsForSqLocation(sqLocId) {
        var _a, _b;
        const rows = sqLocId === null
            ? metricRows
            : metricRows.filter((r) => r.square_location_id === sqLocId);
        const mtdRows = rows.filter((r) => {
            const d = r.due_date;
            return d && d >= thisMonthStart && d <= thisMonthEnd;
        });
        const collectedThisMonth = rows
            .filter((r) => {
            const d = r.due_date;
            const status = r.status;
            if (status === "PAID" && d && d >= thisMonthStart && d <= thisMonthEnd)
                return true;
            const paidAt = r.paid_at;
            if (paidAt && paidAt.slice(0, 10) >= thisMonthStart && paidAt.slice(0, 10) <= thisMonthEnd)
                return true;
            return false;
        })
            .reduce((s, r) => { var _a, _b; return s + ((_b = (_a = r.amount_paid_cents) !== null && _a !== void 0 ? _a : r.amount_cents) !== null && _b !== void 0 ? _b : 0); }, 0);
        const totalInvoicedThisMonth = mtdRows.reduce((s, r) => { var _a, _b; return s + ((_b = (_a = r.requested_amount) !== null && _a !== void 0 ? _a : r.amount_cents) !== null && _b !== void 0 ? _b : 0); }, 0);
        const actualCharged = mtdRows.reduce((s, r) => { var _a; return s + ((_a = r.amount_cents) !== null && _a !== void 0 ? _a : 0); }, 0);
        const discountedThisMonth = Math.max(0, totalInvoicedThisMonth - actualCharged);
        const scheduledPayments = rows
            .filter((r) => r.status === "SCHEDULED" || r.status === "UNPAID")
            .reduce((s, r) => { var _a; return s + ((_a = r.amount_cents) !== null && _a !== void 0 ? _a : 0); }, 0);
        const nextMonthProjected = rows
            .filter((r) => {
            const d = r.due_date;
            return d && d >= nextMonthStart && d <= nextMonthEnd;
        })
            .reduce((s, r) => { var _a, _b; return s + ((_b = (_a = r.requested_amount) !== null && _a !== void 0 ? _a : r.amount_cents) !== null && _b !== void 0 ? _b : 0); }, 0);
        const loc = sqLocId ? sqToLocation[sqLocId] : null;
        return {
            locationId: sqLocId,
            locationName: (_a = loc === null || loc === void 0 ? void 0 : loc.name) !== null && _a !== void 0 ? _a : "All Schools",
            color: (_b = loc === null || loc === void 0 ? void 0 : loc.color) !== null && _b !== void 0 ? _b : "#00ff88",
            collectedThisMonth,
            totalInvoicedThisMonth,
            discountedThisMonth,
            nextMonthProjected,
            scheduledPayments,
        };
    }
    // Get unique sq location IDs that we know about
    const knownSqIds = [...new Set(metricRows.map((r) => r.square_location_id).filter(Boolean))]
        .filter((sqId) => sqToLocation[sqId]);
    const ORDER = ["Bellevue", "Gretna", "Elkhorn", "Omaha"];
    knownSqIds.sort((a, b) => { var _a, _b; return ORDER.indexOf((_a = sqToLocation[a]) === null || _a === void 0 ? void 0 : _a.name) - ORDER.indexOf((_b = sqToLocation[b]) === null || _b === void 0 ? void 0 : _b.name); });
    const billingMetrics = [
        metricsForSqLocation(null), // All Schools
        ...knownSqIds.map((sqId) => metricsForSqLocation(sqId)),
    ];
    // ── Overdue count ──────────────────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: overdueCount } = await db
        .from("square_invoices_fact")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("status", "UNPAID")
        .lt("due_date", today);
    const paidTotal = sumField(metricRows.filter((r) => {
        const d = r.due_date;
        return r.status === "PAID" && d && d >= thisMonthStart && d <= thisMonthEnd;
    }), "amount_paid_cents");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: unpaidRows } = await db
        .from("square_invoices_fact")
        .select("amount_cents")
        .eq("tenant_id", tenantId)
        .eq("status", "UNPAID");
    const unpaidTotal = sumField(unpaidRows !== null && unpaidRows !== void 0 ? unpaidRows : [], "amount_cents");
    // Map invoices to the shape InvoicesClient expects (location_id = sq id for now)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedInvoices = (invoices !== null && invoices !== void 0 ? invoices : []).map((inv) => {
        var _a, _b;
        return (Object.assign(Object.assign({}, inv), { location_id: (_a = inv.square_location_id) !== null && _a !== void 0 ? _a : null, amount_paid: (_b = inv.amount_paid_cents) !== null && _b !== void 0 ? _b : null }));
    });
    return (_jsx(InvoicesClient, { invoices: mappedInvoices, totalCount: count !== null && count !== void 0 ? count : 0, page: page, pageSize: pageSize, paidTotal: paidTotal, unpaidTotal: unpaidTotal, overdueCount: overdueCount !== null && overdueCount !== void 0 ? overdueCount : 0, initialStatus: (_e = params.status) !== null && _e !== void 0 ? _e : "all", initialLocationId: (_f = params.location_id) !== null && _f !== void 0 ? _f : "", initialSearch: (_g = params.search) !== null && _g !== void 0 ? _g : "", initialMonthOffset: monthOffset, viewLabel: viewLabel, billingMetrics: billingMetrics }));
}
