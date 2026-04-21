import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { listContacts } from "@data/contacts";
import { searchCRM } from "@/lib/crm";
import { parseContactSortParams, sortContactsList } from "@/lib/crm/contactListSort";
import { getCRMTenantId } from "../_tenant";
import { CRMLayout, CRMNav, EmptyState } from "../_components";
import { ContactsListClient } from "./contacts-list-client";
export const dynamic = "force-dynamic";
export default async function ContactListPage({ searchParams }) {
    var _a, _b, _c, _d, _e, _f, _g;
    const tenantId = await getCRMTenantId();
    const params = (_a = (await searchParams)) !== null && _a !== void 0 ? _a : {};
    const kind = params.kind;
    const q = ((_c = (_b = params.q) !== null && _b !== void 0 ? _b : params.search) !== null && _c !== void 0 ? _c : "").trim();
    const useCrmSearch = q.length > 0 && (params.type === "contact" || params.type === undefined);
    const { sortKey, sortDir } = parseContactSortParams(params.sort, params.dir);
    let contacts;
    if (useCrmSearch && q) {
        const result = await searchCRM(tenantId, q, { limit: 200 });
        contacts = result.contacts;
        if (kind && ["lead", "student", "family", "teacher"].includes(kind)) {
            contacts = contacts.filter((c) => c.kind === kind);
        }
    }
    else {
        contacts = await listContacts(tenantId, {
            search: ((_d = params.search) !== null && _d !== void 0 ? _d : q) || undefined,
            kind: kind && ["lead", "student", "family", "teacher"].includes(kind)
                ? kind
                : undefined,
            status: params.status,
            tag: params.tag,
            includeArchived: params.includeArchived === "true",
        }, 200);
    }
    contacts = sortContactsList(contacts, sortKey, sortDir);
    return (_jsxs(CRMLayout, { title: "Contacts", subtitle: "Unified search across leads, students, families, and teachers.", children: [_jsx(CRMNav, { current: "contacts" }), _jsxs("form", { className: "mb-4 flex flex-wrap gap-2", method: "get", children: [_jsx("input", { type: "hidden", name: "type", value: "contact" }), params.sort ? (_jsx("input", { type: "hidden", name: "sort", value: params.sort })) : null, params.dir ? (_jsx("input", { type: "hidden", name: "dir", value: params.dir })) : null, _jsx("input", { type: "search", name: "q", placeholder: "Search name, email, phone\u2026", defaultValue: (_f = (_e = params.q) !== null && _e !== void 0 ? _e : params.search) !== null && _f !== void 0 ? _f : "", className: "h-9 w-64 rounded-md border border-[#1c1c1e] bg-[#0a0a0c] px-3 text-sm text-[#f0f0f0] placeholder:text-[#606068]" }), _jsxs("select", { name: "kind", defaultValue: (_g = params.kind) !== null && _g !== void 0 ? _g : "", className: "h-9 rounded-md border border-[#1c1c1e] bg-[#0a0a0c] px-3 text-sm text-[#f0f0f0]", children: [_jsx("option", { value: "", children: "All roles" }), _jsx("option", { value: "lead", children: "Leads" }), _jsx("option", { value: "student", children: "Students" }), _jsx("option", { value: "family", children: "Families" }), _jsx("option", { value: "teacher", children: "Teachers" })] }), _jsxs("label", { className: "inline-flex items-center gap-2 text-xs text-[#909098]", children: [_jsx("input", { type: "checkbox", name: "includeArchived", value: "true", defaultChecked: params.includeArchived === "true" }), "Include archived"] }), _jsx("button", { type: "submit", className: "h-9 rounded-md bg-[#00ff88]/10 px-3 text-sm font-semibold text-[#00ff88] hover:bg-[#00ff88]/20", children: "Search" })] }), contacts.length === 0 ? (_jsx(EmptyState, { title: "No matching contacts", body: q
                    ? "Try a different search term or clear filters."
                    : "Add leads, students, and families to see them here." })) : (_jsx(ContactsListClient, { contacts: contacts }))] }));
}
