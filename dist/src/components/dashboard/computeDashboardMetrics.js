import { daysAgoIso, startOfUtcMonth } from "./dashboardFormat";
export function latestKpiSnapshot(events) {
    for (const e of events) {
        if (e.event_type === "kpi_snapshot" && e.payload && typeof e.payload === "object") {
            return e.payload;
        }
    }
    return null;
}
export function sumCents(invoices, pred) {
    return invoices.reduce((acc, i) => { var _a; return (pred(i) ? acc + ((_a = i.amount_cents) !== null && _a !== void 0 ? _a : 0) : acc); }, 0);
}
export function computeDashboardMetrics(invoices, events) {
    const now = new Date();
    const monthStart = startOfUtcMonth(now);
    const weekAgo = daysAgoIso(7);
    const paidThisMonth = sumCents(invoices, (i) => i.status === "paid" && !!i.paid_at && new Date(i.paid_at).getTime() >= monthStart.getTime());
    const recognizedRevenue = sumCents(invoices, (i) => i.status === "paid");
    const outstanding = sumCents(invoices, (i) => i.status === "sent" || i.status === "overdue");
    // Invoices issued this month (use invoice_date or created_at)
    const thisMonthInvoices = invoices.filter((i) => {
        var _a;
        const d = (_a = i.invoice_date) !== null && _a !== void 0 ? _a : i.created_at;
        return d && new Date(d).getTime() >= monthStart.getTime();
    });
    // Total invoiced = requested_amount (before discounts) or fall back to amount_cents
    const totalInvoicedThisMonth = thisMonthInvoices.reduce((acc, i) => {
        var _a;
        const requested = i.requested_amount;
        return acc + ((_a = requested !== null && requested !== void 0 ? requested : i.amount_cents) !== null && _a !== void 0 ? _a : 0);
    }, 0);
    // Discounted = difference between requested and actual charged
    const actualChargedThisMonth = thisMonthInvoices.reduce((acc, i) => { var _a; return acc + ((_a = i.amount_cents) !== null && _a !== void 0 ? _a : 0); }, 0);
    const discountedThisMonth = Math.max(0, totalInvoicedThisMonth - actualChargedThisMonth);
    // Next month projected ≈ current month collected + 2% growth
    const nextMonthProjected = Math.round(paidThisMonth * 1.02);
    const kpi = latestKpiSnapshot(events);
    const leadsThisWeek = typeof (kpi === null || kpi === void 0 ? void 0 : kpi.leadsThisWeek) === "number"
        ? kpi.leadsThisWeek
        : events.filter((e) => new Date(e.created_at).toISOString() >= weekAgo &&
            /lead|intake|trial_scheduled/i.test(e.event_type)).length;
    const enrollmentsThisWeek = events.filter((e) => e.event_type === "student_enrolled" && new Date(e.created_at).toISOString() >= weekAgo).length;
    const churnThisWeek = events.filter((e) => {
        if (new Date(e.created_at).toISOString() < weekAgo)
            return false;
        const t = e.event_type.toLowerCase();
        return (t.includes("churn") ||
            t.includes("lost") ||
            t.includes("cancel") ||
            t.includes("inactive") ||
            t.includes("drop"));
    }).length;
    const overdueCount = invoices.filter((i) => i.status === "overdue").length;
    const overdueAmount = sumCents(invoices, (i) => i.status === "overdue");
    return {
        recognizedRevenue,
        paidThisMonth,
        totalInvoicedThisMonth,
        discountedThisMonth,
        nextMonthProjected,
        outstanding,
        overdueCount,
        overdueAmount,
        leadsThisWeek,
        enrollmentsThisWeek,
        churnThisWeek,
    };
}
