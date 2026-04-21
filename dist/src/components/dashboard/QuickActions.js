"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useInvoices, useStudents, useEvents } from "@/hooks/data";
import { DASHBOARD_TENANT_ID } from "./constants";
import { QuickActionCard } from "./QuickActionCard";
import { formatShortNumber } from "./dashboardFormat";
function isInvoiceOverdue(inv, now) {
    if (inv.status === "overdue")
        return true;
    if (inv.status !== "sent" || !inv.due_at || inv.paid_at)
        return false;
    const due = new Date(inv.due_at).getTime();
    return Number.isFinite(due) && due < now;
}
export function QuickActions({ showTitle = true }) {
    const router = useRouter();
    const tenantId = DASHBOARD_TENANT_ID;
    const [nowMs, setNowMs] = useState(null);
    useEffect(() => {
        queueMicrotask(() => setNowMs(Date.now()));
        const id = window.setInterval(() => setNowMs(Date.now()), 60000);
        return () => window.clearInterval(id);
    }, []);
    const invoiceParams = useMemo(() => ({
        tenantId,
        page: { mode: "offset", page: 1, pageSize: 200 },
    }), [tenantId]);
    const studentParams = useMemo(() => ({
        tenantId,
        page: { mode: "offset", page: 1, pageSize: 250 },
    }), [tenantId]);
    const eventParams = useMemo(() => ({
        tenantId,
        page: { mode: "offset", page: 1, pageSize: 120 },
    }), [tenantId]);
    const { data: invData } = useInvoices(invoiceParams);
    const { data: stuData } = useStudents(studentParams);
    const { data: evData } = useEvents(eventParams);
    const counts = useMemo(() => {
        var _a, _b, _c;
        const now = nowMs !== null && nowMs !== void 0 ? nowMs : 0;
        const invoices = (_a = invData === null || invData === void 0 ? void 0 : invData.items) !== null && _a !== void 0 ? _a : [];
        const students = (_b = stuData === null || stuData === void 0 ? void 0 : stuData.items) !== null && _b !== void 0 ? _b : [];
        const events = (_c = evData === null || evData === void 0 ? void 0 : evData.items) !== null && _c !== void 0 ? _c : [];
        const overdueInvoices = nowMs == null ? 0 : invoices.filter((i) => isInvoiceOverdue(i, now)).length;
        const pendingEnrollments = students.filter((s) => s.status === "active" && s.onboarding_stage === "new").length;
        const atRiskStudents = students.filter((s) => s.onboarding_stage === "at_risk" ||
            (s.churn_risk && String(s.churn_risk).toLowerCase() === "high")).length;
        const weekMs = 7 * 24 * 60 * 60 * 1000;
        const newLeads = nowMs == null
            ? 0
            : events.filter((e) => {
                const t = new Date(e.created_at).getTime();
                if (!Number.isFinite(t) || now - t > weekMs)
                    return false;
                return /lead|intake|trial_scheduled/i.test(e.event_type);
            }).length;
        return { newLeads, pendingEnrollments, atRiskStudents, overdueInvoices };
    }, [invData, stuData, evData, nowMs]);
    return (_jsxs("section", { className: showTitle ? "space-y-[var(--z-space-4)]" : "", children: [showTitle ? (_jsx("div", { className: "flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between", children: _jsx("h2", { className: "text-sm font-extrabold uppercase tracking-[0.12em] text-[var(--z-muted)]", children: "Quick actions" }) })) : null, _jsxs("div", { className: "grid grid-cols-1 gap-[var(--z-space-3)] lg:grid-cols-2", children: [_jsx(QuickActionCard, { title: `New leads · ${formatShortNumber(counts.newLeads)}`, description: "Triage fresh pipeline activity and follow-ups.", actionLabel: "Open lead work", onClick: () => router.push("/lifecycle/lead-work") }), _jsx(QuickActionCard, { title: `Pending enrollments · ${formatShortNumber(counts.pendingEnrollments)}`, description: "Students still in onboarding \u201Cnew\u201D.", actionLabel: "Enrollment", onClick: () => router.push("/lifecycle/enrollment") }), _jsx(QuickActionCard, { title: `At-risk students · ${formatShortNumber(counts.atRiskStudents)}`, description: "Lifecycle or churn-risk flags need attention.", actionLabel: "View students", onClick: () => router.push("/students") }), _jsx(QuickActionCard, { title: `Overdue invoices · ${formatShortNumber(counts.overdueInvoices)}`, description: "Sent or overdue balances past due date.", actionLabel: "Invoices", onClick: () => router.push("/invoices") })] })] }));
}
