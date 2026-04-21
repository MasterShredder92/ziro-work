import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { listShareLinks } from "@/lib/files/queries";
export const dynamic = "force-dynamic";
export default async function ShareLinksPage() {
    var _a;
    const session = await getSession();
    if (!session)
        redirect("/login?next=/files/shares");
    const tenantId = ((_a = session.tenantId) === null || _a === void 0 ? void 0 : _a.trim()) || DEFAULT_TENANT_ID;
    const links = await listShareLinks(tenantId);
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs("header", { children: [_jsx("div", { className: "text-xs uppercase tracking-wider text-[var(--z-muted)]", children: "Files & Documents" }), _jsx("h1", { className: "text-2xl font-semibold text-[var(--z-fg)]", children: "Share links" })] }), _jsx("div", { className: "overflow-hidden rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-white/[0.02] text-left text-xs uppercase tracking-wider text-[var(--z-muted)]", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3 font-medium", children: "Target" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Status" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Views" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Expires" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Created" })] }) }), _jsxs("tbody", { className: "divide-y divide-[var(--z-border)]", children: [links.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 5, className: "px-4 py-8 text-center text-sm text-[var(--z-muted)]", children: "No share links yet." }) })) : null, links.map((l) => {
                                    var _a, _b;
                                    return (_jsxs("tr", { children: [_jsx("td", { className: "px-4 py-3 text-xs text-[var(--z-fg)]", children: l.fileId ? (_jsxs(Link, { href: `/files/${l.fileId}`, className: "hover:text-[var(--z-accent)]", children: ["File ", l.fileId.slice(0, 8)] })) : (_jsxs("span", { children: ["Folder ", (_b = (_a = l.folderId) === null || _a === void 0 ? void 0 : _a.slice(0, 8)) !== null && _b !== void 0 ? _b : "—"] })) }), _jsx("td", { className: "px-4 py-3 text-xs text-[var(--z-muted)]", children: l.status }), _jsxs("td", { className: "px-4 py-3 text-xs text-[var(--z-muted)]", children: [l.viewCount, l.maxViews ? `/${l.maxViews}` : ""] }), _jsx("td", { className: "px-4 py-3 text-xs text-[var(--z-muted)]", children: l.expiresAt ? new Date(l.expiresAt).toLocaleDateString() : "—" }), _jsx("td", { className: "px-4 py-3 text-xs text-[var(--z-muted)]", children: new Date(l.createdAt).toLocaleDateString() })] }, l.id));
                                })] })] }) })] }));
}
