import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { getFilesDashboard } from "@/lib/files/service";
import { FileList } from "./components";
export const dynamic = "force-dynamic";
function formatBytes(n) {
    if (!n)
        return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let idx = 0;
    let v = n;
    while (v >= 1024 && idx < units.length - 1) {
        v /= 1024;
        idx += 1;
    }
    return `${v.toFixed(v >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
}
export default async function FilesDashboardPage() {
    var _a;
    const session = await getSession();
    if (!session)
        redirect("/login?next=/files");
    const tenantId = ((_a = session.tenantId) === null || _a === void 0 ? void 0 : _a.trim()) || DEFAULT_TENANT_ID;
    const dashboard = await getFilesDashboard(tenantId);
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("header", { className: "flex flex-wrap items-end justify-between gap-3", children: [_jsxs("div", { children: [_jsx("div", { className: "text-xs uppercase tracking-wider text-[var(--z-muted)]", children: "Files & Documents" }), _jsx("h1", { className: "text-2xl font-semibold text-[var(--z-fg)]", children: "Files dashboard" }), _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "Upload, organize, share, and sign documents." })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Link, { href: "/files/explorer", className: "rounded-md border border-[var(--z-border)] px-3 py-1.5 text-xs text-[var(--z-fg)] hover:bg-white/[0.04]", children: "Open explorer" }), _jsx(Link, { href: "/files/explorer?upload=1", className: "rounded-md bg-[var(--z-accent)] px-3 py-1.5 text-xs font-semibold text-black hover:opacity-90", children: "Upload" })] })] }), _jsxs("section", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-4", children: [_jsx(KpiCard, { label: "Total files", value: dashboard.kpis.totalFiles }), _jsx(KpiCard, { label: "Storage used", value: formatBytes(dashboard.kpis.storageBytes) }), _jsx(KpiCard, { label: "Active share links", value: dashboard.kpis.activeShareLinks }), _jsx(KpiCard, { label: "Pending signatures", value: dashboard.kpis.pendingSignatures })] }), _jsxs("section", { className: "space-y-3", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Recent files" }), _jsx(FileList, { files: dashboard.recent })] }), dashboard.signatureRequests.length > 0 ? (_jsxs("section", { className: "space-y-3", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Signature requests" }), _jsx("div", { className: "overflow-hidden rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-white/[0.02] text-left text-xs uppercase tracking-wider text-[var(--z-muted)]", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3 font-medium", children: "Title" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Status" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Signers" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Expires" })] }) }), _jsx("tbody", { className: "divide-y divide-[var(--z-border)]", children: dashboard.signatureRequests.map((r) => (_jsxs("tr", { children: [_jsx("td", { className: "px-4 py-3 text-[var(--z-fg)]", children: r.title }), _jsx("td", { className: "px-4 py-3 text-xs text-[var(--z-muted)]", children: r.status }), _jsx("td", { className: "px-4 py-3 text-xs text-[var(--z-muted)]", children: r.signers.length }), _jsx("td", { className: "px-4 py-3 text-xs text-[var(--z-muted)]", children: r.expiresAt ? new Date(r.expiresAt).toLocaleDateString() : "—" })] }, r.id))) })] }) })] })) : null] }));
}
function KpiCard({ label, value }) {
    return (_jsxs("div", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsx("div", { className: "text-xs uppercase tracking-wider text-[var(--z-muted)]", children: label }), _jsx("div", { className: "mt-1 text-2xl font-semibold text-[var(--z-fg)]", children: value })] }));
}
