import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { buildContextFromSession, getSignatureRequestDetail, } from "@/lib/files/service";
export const dynamic = "force-dynamic";
export default async function SignatureRequestDetailPage({ params }) {
    var _a;
    const { id } = await params;
    const session = await getSession();
    if (!session)
        redirect(`/login?next=/files/signatures/${id}`);
    const tenantId = ((_a = session.tenantId) === null || _a === void 0 ? void 0 : _a.trim()) || DEFAULT_TENANT_ID;
    const ctx = buildContextFromSession({
        role: session.role,
        userId: session.userId,
        tenantId,
    });
    let detail;
    try {
        detail = await getSignatureRequestDetail(id, tenantId, ctx);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message === "NOT_FOUND")
            notFound();
        if (message.startsWith("FORBIDDEN"))
            redirect("/files?error=forbidden");
        throw err;
    }
    const { request, file } = detail;
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("header", { className: "space-y-2", children: [_jsx("div", { className: "text-xs uppercase tracking-wider text-[var(--z-muted)]", children: "Signature request" }), _jsx("h1", { className: "text-2xl font-semibold text-[var(--z-fg)]", children: request.title }), _jsxs("p", { className: "text-sm text-[var(--z-muted)]", children: ["File:", " ", _jsx(Link, { href: `/files/${file.id}`, className: "text-[var(--z-accent)] hover:underline", children: file.name })] }), request.message ? (_jsx("p", { className: "text-sm text-[var(--z-fg)]/90", children: request.message })) : null, _jsxs("div", { className: "flex flex-wrap gap-3 text-xs text-[var(--z-muted)]", children: [_jsxs("span", { children: ["Status: ", request.status] }), request.expiresAt ? (_jsxs("span", { children: ["Expires: ", new Date(request.expiresAt).toLocaleString()] })) : null] })] }), _jsxs("section", { className: "space-y-2", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Signers" }), _jsx("div", { className: "overflow-hidden rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-white/[0.02] text-left text-xs uppercase tracking-wider text-[var(--z-muted)]", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3 font-medium", children: "Name" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Email" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Status" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Order" })] }) }), _jsx("tbody", { className: "divide-y divide-[var(--z-border)]", children: request.signers.map((s) => (_jsxs("tr", { children: [_jsx("td", { className: "px-4 py-3 text-[var(--z-fg)]", children: s.name }), _jsx("td", { className: "px-4 py-3 text-xs text-[var(--z-muted)]", children: s.email }), _jsx("td", { className: "px-4 py-3 text-xs text-[var(--z-muted)]", children: s.status }), _jsx("td", { className: "px-4 py-3 text-xs text-[var(--z-muted)]", children: s.order })] }, s.id))) })] }) })] }), _jsxs("section", { className: "space-y-2", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Audit trail" }), request.audit.length === 0 ? (_jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "No audit events yet." })) : (_jsx("div", { className: "overflow-hidden rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-white/[0.02] text-left text-xs uppercase tracking-wider text-[var(--z-muted)]", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3 font-medium", children: "Time" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Event" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Actor" })] }) }), _jsx("tbody", { className: "divide-y divide-[var(--z-border)]", children: [...request.audit]
                                        .sort((a, b) => b.at.localeCompare(a.at))
                                        .map((a, i) => (_jsxs("tr", { children: [_jsx("td", { className: "px-4 py-3 text-xs text-[var(--z-muted)]", children: new Date(a.at).toLocaleString() }), _jsx("td", { className: "px-4 py-3 text-[var(--z-fg)]", children: a.event }), _jsx("td", { className: "px-4 py-3 text-xs text-[var(--z-muted)]", children: a.actor })] }, `${a.at}-${i}`))) })] }) }))] }), _jsx("div", { children: _jsx(Link, { href: "/files/signatures", className: "text-sm text-[var(--z-accent)] hover:underline", children: "\u2190 All signature requests" }) })] }));
}
