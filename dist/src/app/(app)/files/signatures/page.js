import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { listSignatureRequests } from "@/lib/files/queries";
export const dynamic = "force-dynamic";
export default async function SignaturesPage() {
    var _a;
    const session = await getSession();
    if (!session)
        redirect("/login?next=/files/signatures");
    const tenantId = ((_a = session.tenantId) === null || _a === void 0 ? void 0 : _a.trim()) || DEFAULT_TENANT_ID;
    const requests = await listSignatureRequests(tenantId);
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs("header", { className: "flex flex-wrap items-end justify-between gap-3", children: [_jsxs("div", { children: [_jsx("div", { className: "text-xs uppercase tracking-wider text-[var(--z-muted)]", children: "Files & Documents" }), _jsx("h1", { className: "text-2xl font-semibold text-[var(--z-fg)]", children: "Signature requests" })] }), _jsx(Link, { href: "/files/explorer", className: "rounded-md border border-[var(--z-border)] px-3 py-1.5 text-xs text-[var(--z-fg)] hover:bg-white/[0.04]", children: "Browse files to sign" })] }), _jsx("div", { className: "overflow-hidden rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-white/[0.02] text-left text-xs uppercase tracking-wider text-[var(--z-muted)]", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3 font-medium", children: "Title" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Status" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Signers" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Expires" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Updated" })] }) }), _jsxs("tbody", { className: "divide-y divide-[var(--z-border)]", children: [requests.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 5, className: "px-4 py-8 text-center text-sm text-[var(--z-muted)]", children: "No signature requests yet." }) })) : null, requests.map((r) => (_jsxs("tr", { children: [_jsx("td", { className: "px-4 py-3", children: _jsx(Link, { href: `/files/signatures/${r.id}`, className: "font-medium text-[var(--z-fg)] hover:text-[var(--z-accent)]", children: r.title }) }), _jsx("td", { className: "px-4 py-3 text-xs text-[var(--z-muted)]", children: r.status }), _jsx("td", { className: "px-4 py-3 text-xs text-[var(--z-muted)]", children: r.signers.length }), _jsx("td", { className: "px-4 py-3 text-xs text-[var(--z-muted)]", children: r.expiresAt ? new Date(r.expiresAt).toLocaleDateString() : "—" }), _jsx("td", { className: "px-4 py-3 text-xs text-[var(--z-muted)]", children: new Date(r.updatedAt).toLocaleDateString() })] }, r.id)))] })] }) })] }));
}
