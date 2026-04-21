import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { can } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { assertTenantAccess } from "@/lib/auth/guards";
import { FILES_NAV_ITEMS, FilesPublicLayout, FilesShell, FilesToastHost, } from "./components";
async function resolvePathname() {
    var _a, _b, _c, _d, _e;
    try {
        const h = await headers();
        return ((_e = (_c = (_b = (_a = h.get("x-invoke-path")) !== null && _a !== void 0 ? _a : h.get("next-url")) !== null && _b !== void 0 ? _b : h.get("x-pathname")) !== null && _c !== void 0 ? _c : (_d = h.get("referer")) === null || _d === void 0 ? void 0 : _d.replace(/^https?:\/\/[^/]+/, "")) !== null && _e !== void 0 ? _e : "");
    }
    catch (_f) {
        return "";
    }
}
export default async function FilesLayout({ children, }) {
    var _a, _b;
    const pathname = await resolvePathname();
    const isPublic = pathname.includes("/files/share/") ||
        pathname.includes("/files/sign/");
    if (isPublic) {
        return (_jsxs(FilesPublicLayout, { children: [_jsx(FilesToastHost, {}), _jsx("div", { className: "rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] p-4 shadow-lg md:p-6", children: children })] }));
    }
    const session = await getSession();
    if (!session)
        redirect("/login?next=/files");
    const canRead = can(session.role, "files.read");
    if (!canRead)
        redirect("/");
    const tenantId = ((_a = session.tenantId) === null || _a === void 0 ? void 0 : _a.trim()) || DEFAULT_TENANT_ID;
    await assertTenantAccess(tenantId);
    const allowedNavIds = FILES_NAV_ITEMS.filter((item) => !item.scope || can(session.role, item.scope)).map((i) => i.id);
    const currentUserName = (_b = session.userId) !== null && _b !== void 0 ? _b : null;
    return (_jsx(FilesShell, { allowedNavIds: allowedNavIds, currentUserName: currentUserName, children: children }));
}
