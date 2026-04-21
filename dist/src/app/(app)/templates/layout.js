import { jsx as _jsx } from "react/jsx-runtime";
import { redirect } from "next/navigation";
import { can } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { assertTenantAccess } from "@/lib/auth/guards";
import { TEMPLATES_NAV_ITEMS, TemplatesShell, } from "./components";
export default async function TemplatesLayout({ children, }) {
    var _a, _b;
    const session = await getSession();
    if (!session)
        redirect("/login?next=/templates");
    const canRead = can(session.role, "templates.read");
    const isPrivileged = session.role === "admin" || session.role === "director";
    if (!canRead || !isPrivileged) {
        redirect("/");
    }
    const tenantId = ((_a = session.tenantId) === null || _a === void 0 ? void 0 : _a.trim()) || DEFAULT_TENANT_ID;
    await assertTenantAccess(tenantId);
    const allowedNavIds = TEMPLATES_NAV_ITEMS.filter((item) => !item.scope || can(session.role, item.scope)).map((i) => i.id);
    const currentUserName = (_b = session.userId) !== null && _b !== void 0 ? _b : null;
    return (_jsx(TemplatesShell, { allowedNavIds: allowedNavIds, currentUserName: currentUserName, children: children }));
}
