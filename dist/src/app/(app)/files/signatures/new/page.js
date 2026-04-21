import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getSession } from "@/lib/auth/session";
import { notFound, redirect } from "next/navigation";
import { can } from "@/lib/auth/permissions";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { getFile } from "@/lib/files/queries";
import { SignatureRequestEditor } from "../../components";
export const dynamic = "force-dynamic";
export default async function NewSignatureRequestPage({ searchParams, }) {
    var _a, _b;
    const session = await getSession();
    if (!session)
        redirect("/login?next=/files/signatures/new");
    const canSign = can(session.role, "files.sign");
    if (!canSign)
        redirect("/files?error=forbidden");
    const sp = await searchParams;
    const fileId = (_a = sp === null || sp === void 0 ? void 0 : sp.fileId) === null || _a === void 0 ? void 0 : _a.trim();
    if (!fileId) {
        redirect("/files/explorer");
    }
    const tenantId = ((_b = session.tenantId) === null || _b === void 0 ? void 0 : _b.trim()) || DEFAULT_TENANT_ID;
    const file = await getFile(fileId, tenantId);
    if (!file)
        notFound();
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs("header", { children: [_jsx("div", { className: "text-xs uppercase tracking-wider text-[var(--z-muted)]", children: "Files & Documents" }), _jsx("h1", { className: "text-2xl font-semibold text-[var(--z-fg)]", children: "New signature request" }), _jsxs("p", { className: "mt-1 text-sm text-[var(--z-muted)]", children: ["Request signatures on ", _jsx("span", { className: "text-[var(--z-fg)]", children: file.name }), "."] })] }), _jsx(SignatureRequestEditor, { file: file, canSign: canSign })] }));
}
