import "server-only";
import { getServiceClient } from "@/lib/supabase";
import { bestFuzzyScore } from "./fuzzy";
const ALL_DOMAINS = [
    "contacts",
    "students",
    "leads",
    "forms",
    "templates",
    "content",
];
export async function globalSearch(args) {
    var _a, _b, _c;
    const query = args.query.trim();
    if (!query)
        return [];
    const domains = args.domains && args.domains.length > 0 ? args.domains : ALL_DOMAINS;
    const candidateLimit = Math.max(1, Math.min(50, (_a = args.candidateLimit) !== null && _a !== void 0 ? _a : 20));
    const limit = Math.max(1, Math.min(100, (_b = args.limit) !== null && _b !== void 0 ? _b : 25));
    const baseRole = (_c = args.session.baseRole) !== null && _c !== void 0 ? _c : args.session.role;
    const tenantId = baseRole === "admin" ? null : args.session.tenantId;
    const grouped = await Promise.all(domains.map((d) => searchDomain(d, query, tenantId, candidateLimit)));
    return grouped
        .flat()
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}
async function searchDomain(domain, query, tenantId, candidateLimit) {
    try {
        switch (domain) {
            case "contacts":
                return await searchTable({
                    table: "contacts",
                    tenantId,
                    query,
                    candidateLimit,
                    textColumns: ["first_name", "last_name", "email", "phone"],
                    map: (row) => {
                        var _a, _b, _c, _d;
                        return ({
                            domain,
                            id: String(row.id),
                            title: [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || String((_a = row.email) !== null && _a !== void 0 ? _a : "(no name)"),
                            subtitle: (_c = (_b = row.email) !== null && _b !== void 0 ? _b : row.phone) !== null && _c !== void 0 ? _c : undefined,
                            href: `/families/contacts/${row.id}`,
                            tenantId: (_d = row.tenant_id) !== null && _d !== void 0 ? _d : null,
                        });
                    },
                });
            case "students":
                return await searchTable({
                    table: "students",
                    tenantId,
                    query,
                    candidateLimit,
                    textColumns: ["first_name", "last_name", "display_name", "instrument"],
                    map: (row) => {
                        var _a, _b, _c;
                        return ({
                            domain,
                            id: String(row.id),
                            title: ((_a = row.display_name) !== null && _a !== void 0 ? _a : [row.first_name, row.last_name].filter(Boolean).join(" ").trim()) ||
                                "(unnamed student)",
                            subtitle: (_b = row.instrument) !== null && _b !== void 0 ? _b : undefined,
                            href: `/students/${row.id}`,
                            tenantId: (_c = row.tenant_id) !== null && _c !== void 0 ? _c : null,
                        });
                    },
                });
            case "leads":
                return await searchTable({
                    table: "leads",
                    tenantId,
                    query,
                    candidateLimit,
                    textColumns: ["name", "email", "phone", "source"],
                    map: (row) => {
                        var _a, _b, _c, _d, _e;
                        return ({
                            domain,
                            id: String(row.id),
                            title: (_b = (_a = row.name) !== null && _a !== void 0 ? _a : row.email) !== null && _b !== void 0 ? _b : "(unnamed lead)",
                            subtitle: (_d = (_c = row.source) !== null && _c !== void 0 ? _c : row.email) !== null && _d !== void 0 ? _d : undefined,
                            href: `/leads/${row.id}`,
                            tenantId: (_e = row.tenant_id) !== null && _e !== void 0 ? _e : null,
                        });
                    },
                });
            case "forms":
                return await searchTable({
                    table: "forms",
                    tenantId,
                    query,
                    candidateLimit,
                    textColumns: ["name", "slug", "description"],
                    map: (row) => {
                        var _a, _b, _c;
                        return ({
                            domain,
                            id: String(row.id),
                            title: (_a = row.name) !== null && _a !== void 0 ? _a : "(unnamed form)",
                            subtitle: (_b = row.slug) !== null && _b !== void 0 ? _b : undefined,
                            href: `/forms/${row.id}`,
                            tenantId: (_c = row.tenant_id) !== null && _c !== void 0 ? _c : null,
                        });
                    },
                });
            case "templates":
                return await searchTable({
                    table: "templates",
                    tenantId,
                    query,
                    candidateLimit,
                    textColumns: ["name", "kind", "description"],
                    map: (row) => {
                        var _a, _b, _c;
                        return ({
                            domain,
                            id: String(row.id),
                            title: (_a = row.name) !== null && _a !== void 0 ? _a : "(unnamed template)",
                            subtitle: (_b = row.kind) !== null && _b !== void 0 ? _b : undefined,
                            href: `/templates/${row.id}`,
                            tenantId: (_c = row.tenant_id) !== null && _c !== void 0 ? _c : null,
                        });
                    },
                });
            case "content":
                return await searchTable({
                    table: "content_items",
                    tenantId,
                    query,
                    candidateLimit,
                    textColumns: ["title", "description", "kind"],
                    map: (row) => {
                        var _a, _b, _c;
                        return ({
                            domain,
                            id: String(row.id),
                            title: (_a = row.title) !== null && _a !== void 0 ? _a : "(untitled content)",
                            subtitle: (_b = row.kind) !== null && _b !== void 0 ? _b : undefined,
                            href: `/content/${row.id}`,
                            tenantId: (_c = row.tenant_id) !== null && _c !== void 0 ? _c : null,
                        });
                    },
                });
            default:
                return [];
        }
    }
    catch (_a) {
        return [];
    }
}
async function searchTable(args) {
    const sb = getServiceClient();
    const pattern = `%${args.query.replace(/[%_]/g, "\\$&")}%`;
    const orFilter = args.textColumns.map((col) => `${col}.ilike.${pattern}`).join(",");
    let q = sb.from(args.table).select("*").limit(args.candidateLimit);
    if (args.tenantId)
        q = q.eq("tenant_id", args.tenantId);
    q = q.or(orFilter);
    const { data, error } = await q;
    if (error || !data)
        return [];
    return data
        .map((raw) => {
        var _a;
        const row = raw;
        const base = args.map(row);
        const searchable = args.textColumns
            .map((col) => { var _a; return ((_a = row[col]) !== null && _a !== void 0 ? _a : ""); })
            .filter((s) => typeof s === "string" && s.length > 0);
        const score = bestFuzzyScore(args.query, [base.title, (_a = base.subtitle) !== null && _a !== void 0 ? _a : "", ...searchable].filter(Boolean));
        return Object.assign(Object.assign({}, base), { score });
    })
        .filter((r) => r.score > 0);
}
