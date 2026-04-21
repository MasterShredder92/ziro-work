import { jsx as _jsx } from "react/jsx-runtime";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { can } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { assertTenantAccess } from "@/lib/auth/guards";
import { FORMS_NAV_ITEMS, FormsShell } from "./components";
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
export default async function FormsLayout({ children, }) {
    var _a, _b;
    const pathname = await resolvePathname();
    const isPublicRunner = pathname.includes("/forms/run/");
    if (isPublicRunner) {
        return (_jsx("div", { className: "min-h-screen w-full bg-[color-mix(in_oklab,var(--z-bg),black_4%)] px-4 py-10", children: _jsx("div", { className: "mx-auto max-w-2xl rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] p-6 shadow-lg", children: children }) }));
    }
    const session = await getSession();
    if (!session)
        redirect("/login?next=/forms");
    const canRead = can(session.role, "forms.read");
    const isPrivileged = session.role === "admin" || session.role === "director";
    if (!canRead || !isPrivileged) {
        redirect("/");
    }
    const tenantId = ((_a = session.tenantId) === null || _a === void 0 ? void 0 : _a.trim()) || DEFAULT_TENANT_ID;
    await assertTenantAccess(tenantId);
    const allowedNavIds = FORMS_NAV_ITEMS.filter((item) => !item.scope || can(session.role, item.scope)).map((i) => i.id);
    const currentUserName = (_b = session.userId) !== null && _b !== void 0 ? _b : null;
    return (_jsx(FormsShell, { allowedNavIds: allowedNavIds, currentUserName: currentUserName, children: children }));
}
