import "server-only";
import { assertTenantAccess } from "@/lib/auth/guards";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { getFamilyBilling, getFamilyMessages, getFamilyRecord, getFamilySchedule, getFamilyStudents, } from "./queries";
function emptyBillingSummary() {
    return {
        totalBilledCents: 0,
        totalPaidCents: 0,
        balanceCents: 0,
        overdueCount: 0,
        overdueAmountCents: 0,
        monthToDateRevenueCents: 0,
        invoiceCount: 0,
    };
}
function computeBillingSummary(invoices) {
    var _a;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const todayIso = now.toISOString().slice(0, 10);
    let totalBilled = 0;
    let totalPaid = 0;
    let overdueCount = 0;
    let overdueAmount = 0;
    let mtd = 0;
    for (const inv of invoices) {
        totalBilled += inv.amount_cents;
        totalPaid += inv.amount_paid_cents;
        const status = ((_a = inv.status) !== null && _a !== void 0 ? _a : "").toUpperCase();
        const isUnpaid = status === "UNPAID" || status === "PARTIALLY_PAID" || status === "SENT";
        if (isUnpaid && inv.due_date && inv.due_date < todayIso) {
            overdueCount += 1;
            overdueAmount += inv.balance_cents;
        }
        const invoiceDate = inv.invoice_date
            ? new Date(`${inv.invoice_date}T00:00:00`)
            : null;
        if (invoiceDate && invoiceDate >= startOfMonth) {
            mtd += inv.amount_paid_cents;
        }
    }
    return {
        totalBilledCents: totalBilled,
        totalPaidCents: totalPaid,
        balanceCents: Math.max(0, totalBilled - totalPaid),
        overdueCount,
        overdueAmountCents: overdueAmount,
        monthToDateRevenueCents: mtd,
        invoiceCount: invoices.length,
    };
}
export async function getFamilyDashboard(familyId) {
    var _a;
    const family = await getFamilyRecord(familyId);
    const tenantId = (_a = family === null || family === void 0 ? void 0 : family.tenant_id) !== null && _a !== void 0 ? _a : DEFAULT_TENANT_ID;
    await assertTenantAccess(tenantId);
    const [students, schedule, billing, messages] = await Promise.all([
        getFamilyStudents(familyId, tenantId),
        getFamilySchedule(familyId, tenantId),
        getFamilyBilling(familyId, tenantId),
        getFamilyMessages(familyId, tenantId),
    ]);
    const billingSummary = family
        ? computeBillingSummary(billing.invoices)
        : emptyBillingSummary();
    return {
        family,
        students,
        schedule,
        billing: billing.invoices,
        billingSummary,
        payments: billing.payments,
        messages,
        generatedAt: new Date().toISOString(),
    };
}
