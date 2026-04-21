import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BarChart3, Gauge, MousePointerClick, Sparkles, Timer, Users, Waypoints, Zap, } from "lucide-react";
import { InsightStat } from "@/components/marketing/InsightStat";
import { PageShell } from "@/components/layouts/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { listScheduleBlocks } from "@data/scheduleBlocks";
import { listMessages } from "@data/messageRecords";
import { listInvoices } from "@data/invoices";
import { listLeads } from "@data/leads";
import { listStudents } from "@data/students";
import { listSubscriptions } from "@data/subscriptions";
async function loadTelemetry() {
    const tenantId = DEFAULT_TENANT_ID;
    try {
        const [blocks, messages, invoices, leads, students, subscriptions] = await Promise.all([
            listScheduleBlocks(tenantId, undefined, { limit: 1000 }),
            listMessages(tenantId, undefined, { limit: 1000 }),
            listInvoices(tenantId, undefined, { limit: 1000 }),
            listLeads(tenantId, undefined, { limit: 1000 }),
            listStudents(tenantId, undefined, { limit: 1000 }),
            listSubscriptions(tenantId, undefined, { limit: 1000 }),
        ]);
        const paidInvoices = invoices.filter((invoice) => invoice.status === "paid");
        const openLeads = leads.filter((lead) => lead.stage !== "lost");
        return {
            schedulingBlocks: blocks.length,
            messagesSent: messages.length,
            invoicesTotal: invoices.length,
            invoicesPaid: paidInvoices.length,
            activeLeads: openLeads.length,
            activeStudents: students.filter((s) => s.status !== "inactive").length,
            activeSubscriptions: subscriptions.filter((s) => s.status === "active").length,
        };
    }
    catch (_a) {
        return {
            schedulingBlocks: 0,
            messagesSent: 0,
            invoicesTotal: 0,
            invoicesPaid: 0,
            activeLeads: 0,
            activeStudents: 0,
            activeSubscriptions: 0,
        };
    }
}
export default async function MarketingInsightsPage() {
    const telemetry = await loadTelemetry();
    return (_jsx(PageShell, { children: _jsxs("div", { className: "flex flex-col gap-[var(--z-space-8)]", children: [_jsx(PageHeader, { title: "Marketing Insights", subtitle: "Live operational telemetry from Scheduling, Messaging, Billing, and CRM domains." }), _jsx(Section, { accent: true, spacing: "tight", title: "Traffic", description: "Usage-based operational telemetry.", children: _jsxs("div", { className: "grid grid-cols-1 gap-[var(--z-space-4)] sm:grid-cols-2 xl:grid-cols-4", children: [_jsx(InsightStat, { label: "Schedule blocks", value: `${telemetry.schedulingBlocks}`, icon: _jsx(Gauge, { className: "h-5 w-5" }) }), _jsx(InsightStat, { label: "Messages sent", value: `${telemetry.messagesSent}`, icon: _jsx(Users, { className: "h-5 w-5" }) }), _jsx(InsightStat, { label: "Active students", value: `${telemetry.activeStudents}`, icon: _jsx(Timer, { className: "h-5 w-5" }) }), _jsx(InsightStat, { label: "Active leads", value: `${telemetry.activeLeads}`, icon: _jsx(Waypoints, { className: "h-5 w-5" }) })] }) }), _jsx(Section, { accent: true, spacing: "tight", title: "Conversion", description: "Billing and conversion outcomes.", children: _jsxs("div", { className: "grid grid-cols-1 gap-[var(--z-space-4)] sm:grid-cols-2 xl:grid-cols-4", children: [_jsx(InsightStat, { label: "Invoices total", value: `${telemetry.invoicesTotal}`, icon: _jsx(Sparkles, { className: "h-5 w-5" }) }), _jsx(InsightStat, { label: "Invoices paid", value: `${telemetry.invoicesPaid}`, icon: _jsx(MousePointerClick, { className: "h-5 w-5" }) }), _jsx(InsightStat, { label: "Subscriptions active", value: `${telemetry.activeSubscriptions}`, icon: _jsx(BarChart3, { className: "h-5 w-5" }) }), _jsx(InsightStat, { label: "Collections conversion", value: `${telemetry.invoicesTotal ? Math.round((telemetry.invoicesPaid / telemetry.invoicesTotal) * 100) : 0}%`, icon: _jsx(Zap, { className: "h-5 w-5" }) })] }) }), _jsx(Section, { accent: true, spacing: "tight", title: "Demo engagement", description: "Cross-domain KPI blend.", children: _jsxs("div", { className: "grid grid-cols-1 gap-[var(--z-space-4)] sm:grid-cols-2 xl:grid-cols-3", children: [_jsx(InsightStat, { label: "CRM engagement index", value: `${telemetry.activeLeads + telemetry.activeStudents}`, icon: _jsx(Sparkles, { className: "h-5 w-5" }) }), _jsx(InsightStat, { label: "Messaging per student", value: `${telemetry.activeStudents ? (telemetry.messagesSent / telemetry.activeStudents).toFixed(1) : "0.0"}`, icon: _jsx(Waypoints, { className: "h-5 w-5" }) }), _jsx(InsightStat, { label: "Scheduling density", value: `${telemetry.activeStudents ? (telemetry.schedulingBlocks / telemetry.activeStudents).toFixed(1) : "0.0"}`, icon: _jsx(BarChart3, { className: "h-5 w-5" }) }), _jsx(InsightStat, { label: "Billing activity score", value: `${telemetry.invoicesTotal + telemetry.activeSubscriptions}`, icon: _jsx(Users, { className: "h-5 w-5" }) })] }) })] }) }));
}
