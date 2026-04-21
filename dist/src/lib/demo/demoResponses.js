import { offsetRange } from "@/lib/data/core";
import { DEMO_EVENTS, DEMO_FAMILIES, DEMO_INVOICES, DEMO_STUDENTS, DEMO_TEACHERS, } from "@/lib/demo/demoData";
function offsetSlice(items, page) {
    var _a;
    if (page.mode !== "offset")
        return items.slice(0, Math.min(items.length, (_a = page.limit) !== null && _a !== void 0 ? _a : 50));
    const { from, to } = offsetRange(page.page, page.pageSize);
    return items.slice(from, to + 1);
}
function pageInfo(page) {
    var _a;
    if (page.mode === "offset") {
        const r = offsetRange(page.page, page.pageSize);
        return {
            mode: "offset",
            page: r.page,
            pageSize: r.pageSize,
            range: { from: r.from, to: r.to },
        };
    }
    return { mode: "cursor", limit: (_a = page.limit) !== null && _a !== void 0 ? _a : 50, cursor: page.cursor };
}
function ok(items, page) {
    return {
        data: {
            items: offsetSlice(items, page),
            pageInfo: pageInfo(page),
        },
        error: null,
    };
}
function matches(term, fields) {
    const t = term.toLowerCase();
    return fields.some((f) => f.toLowerCase().includes(t));
}
export function demoListStudents(params) {
    var _a;
    let list = [...DEMO_STUDENTS];
    const s = (_a = params.search) === null || _a === void 0 ? void 0 : _a.trim();
    if (s) {
        list = list.filter((row) => { var _a, _b, _c; return matches(s, [row.name, (_a = row.email) !== null && _a !== void 0 ? _a : "", (_b = row.phone) !== null && _b !== void 0 ? _b : "", row.status, (_c = row.onboarding_stage) !== null && _c !== void 0 ? _c : ""]); });
    }
    return ok(list, params.page);
}
export function demoListTeachers(params) {
    var _a;
    let list = [...DEMO_TEACHERS];
    const s = (_a = params.search) === null || _a === void 0 ? void 0 : _a.trim();
    if (s) {
        list = list.filter((row) => { var _a, _b; return matches(s, [row.name, (_a = row.email) !== null && _a !== void 0 ? _a : "", (_b = row.phone) !== null && _b !== void 0 ? _b : "", row.status]); });
    }
    return ok(list, params.page);
}
export function demoListFamilies(params) {
    var _a;
    let list = [...DEMO_FAMILIES];
    const s = (_a = params.search) === null || _a === void 0 ? void 0 : _a.trim();
    if (s) {
        list = list.filter((row) => { var _a, _b; return matches(s, [row.name, (_a = row.primary_email) !== null && _a !== void 0 ? _a : "", (_b = row.primary_phone) !== null && _b !== void 0 ? _b : ""]); });
    }
    return ok(list, params.page);
}
export function demoListInvoices(params) {
    const list = [...DEMO_INVOICES].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return ok(list, params.page);
}
export function demoListEvents(params) {
    const list = [...DEMO_EVENTS].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return ok(list, params.page);
}
