/**
 * Read-side queries for the CRM OS. Wraps the tenant-scoped @data
 * facades and the unified contact projection.
 */
import { listContacts, getContactById } from "@data/contacts";
import { listStudents } from "@data/students";
import { listFamilies } from "@data/families";
import { listTeachers } from "@data/teachers";
import { listLeads } from "@data/leads";
import { listEnrollments } from "@data/enrollments";
export { listContacts, getContactById, listEnrollments, };
export async function listStudentsScoped(tenantId, filter) {
    return listStudents(tenantId, filter);
}
export async function listFamiliesScoped(tenantId, filter) {
    return listFamilies(tenantId, filter);
}
export async function listTeachersScoped(tenantId, filter) {
    const rows = await listTeachers(tenantId, filter);
    return rows;
}
export async function listLeadsScoped(tenantId, filter) {
    return listLeads(tenantId, filter);
}
/**
 * Unified CRM search — fans out to contacts, families, teachers, students,
 * and leads for the given tenant and term.
 */
export async function searchCRM(tenantId, term, opts) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    const limit = (_a = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _a !== void 0 ? _a : 50;
    const search = term.trim();
    const filter = {
        search,
        includeArchived: opts === null || opts === void 0 ? void 0 : opts.includeArchived,
    };
    const contacts = await listContacts(tenantId, filter, limit * 4);
    const families = [];
    const students = [];
    const teachers = [];
    const leads = [];
    for (const c of contacts) {
        if (c.kind === "family") {
            // Look up full family row lazily if needed; projection suffices for now.
        }
        if (c.kind === "student") {
            students.push({
                id: c.sourceId,
                tenant_id: c.tenantId,
                first_name: (_b = c.firstName) !== null && _b !== void 0 ? _b : "",
                last_name: (_c = c.lastName) !== null && _c !== void 0 ? _c : "",
                email: c.email,
                phone: c.phone,
                status: (_d = c.status) !== null && _d !== void 0 ? _d : "",
                family_id: c.familyId,
                teacher_id: c.teacherId,
                location_id: c.locationId,
                tags: c.tags,
                source: c.source,
                created_at: (_e = c.createdAt) !== null && _e !== void 0 ? _e : "",
                updated_at: (_f = c.updatedAt) !== null && _f !== void 0 ? _f : "",
            });
        }
        if (c.kind === "teacher") {
            teachers.push({
                id: c.sourceId,
                tenant_id: c.tenantId,
                first_name: (_g = c.firstName) !== null && _g !== void 0 ? _g : null,
                last_name: (_h = c.lastName) !== null && _h !== void 0 ? _h : null,
                email: c.email,
                phone: c.phone,
                instruments: [],
                is_active: !c.archived,
                created_at: (_j = c.createdAt) !== null && _j !== void 0 ? _j : "",
                updated_at: (_k = c.updatedAt) !== null && _k !== void 0 ? _k : "",
            });
        }
        if (c.kind === "family") {
            families.push({
                id: c.sourceId,
                tenant_id: c.tenantId,
                name: c.fullName,
                primary_email: c.email,
                primary_phone: c.phone,
                primary_location_id: c.locationId,
                billing_status: (_l = c.status) !== null && _l !== void 0 ? _l : "",
                created_at: (_m = c.createdAt) !== null && _m !== void 0 ? _m : "",
                updated_at: (_o = c.updatedAt) !== null && _o !== void 0 ? _o : "",
            });
        }
        if (c.kind === "lead") {
            leads.push({
                id: c.sourceId,
                tenant_id: c.tenantId,
                first_name: (_p = c.firstName) !== null && _p !== void 0 ? _p : "",
                last_name: c.lastName,
                email: c.email,
                phone: c.phone,
                stage: c.stage,
                family_id: c.familyId,
                location_id: c.locationId,
                source: c.source,
                created_at: (_q = c.createdAt) !== null && _q !== void 0 ? _q : "",
                updated_at: (_r = c.updatedAt) !== null && _r !== void 0 ? _r : "",
            });
        }
    }
    return { contacts: contacts.slice(0, limit), families, students, teachers, leads };
}
export async function getCRMKpis(tenantId) {
    const [students, teachers, families, leads, enrollments] = await Promise.all([
        listStudents(tenantId, undefined, { limit: 1000 }),
        listTeachers(tenantId, undefined, { limit: 1000 }),
        listFamilies(tenantId, undefined, { limit: 1000 }),
        listLeads(tenantId, undefined, { limit: 1000 }),
        listEnrollments(tenantId, undefined, { limit: 1000 }),
    ]);
    const thirtyDaysAgo = Date.now() - 30 * 86400000;
    const enrolledLast30d = enrollments.filter((e) => {
        if (!e.start_date)
            return false;
        return new Date(e.start_date).getTime() >= thirtyDaysAgo;
    }).length;
    const activeEnrollments = enrollments.filter((e) => e.status === "active").length;
    const isTeacherActive = (t) => {
        const row = t;
        return row.status === "active" || row.is_active === true;
    };
    return {
        totalContacts: students.length + teachers.length + families.length + leads.length,
        activeStudents: students.filter((s) => s.status === "enrolled").length,
        activeTeachers: teachers.filter(isTeacherActive).length,
        families: families.length,
        openLeads: leads.filter((l) => l.stage !== "lost" && l.stage !== "enrolled")
            .length,
        enrolledLast30d,
        activeEnrollments,
    };
}
