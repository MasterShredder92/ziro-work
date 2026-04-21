import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { listEnrollments } from "@data/enrollments";
import { getStudentsByIds, listStudents } from "@data/students";
import { getTeachersByIds, listTeachers } from "@data/teachers";
import { enrollmentSortOrder, ENROLLMENT_SORT_KEYS, parseTableSort, } from "@/lib/crm/crmListSortMaps";
import { getCRMTenantId } from "../_tenant";
import { CRMLayout, CRMNav, EmptyState } from "../_components";
import { EnrollmentActions, EnrollmentFilters } from "./_client";
import { EnrollmentsListClient } from "./enrollments-list-client";
export const dynamic = "force-dynamic";
const DEFAULT_STATUSES = ["active", "ended", "cancelled", "completed", "pending"];
export default async function EnrollmentManagerPage({ searchParams, }) {
    var _a;
    const tenantId = await getCRMTenantId();
    const params = (_a = (await searchParams)) !== null && _a !== void 0 ? _a : {};
    const parsed = parseTableSort(params.sort, params.dir, ENROLLMENT_SORT_KEYS);
    const order = enrollmentSortOrder(parsed.key, parsed.dir);
    const rows = await listEnrollments(tenantId, {
        student_id: params.studentId,
        teacher_id: params.teacherId,
        status: params.status,
    }, {
        limit: 2000,
        orderBy: order.orderBy,
        ascending: order.ascending,
    });
    const statusUnion = Array.from(new Set([...DEFAULT_STATUSES, ...rows.map((r) => r.status)])).sort();
    const studentIds = [...new Set(rows.map((r) => r.student_id))];
    const teacherIds = [...new Set(rows.map((r) => r.teacher_id))];
    const [students, teachers, teacherOptions, studentOptions] = await Promise.all([
        getStudentsByIds(tenantId, studentIds),
        getTeachersByIds(tenantId, teacherIds),
        listTeachers(tenantId, undefined, { limit: 500 }),
        listStudents(tenantId, undefined, { limit: 500 }),
    ]);
    const studentName = new Map(students.map((s) => {
        var _a, _b;
        return [
            s.id,
            `${(_a = s.first_name) !== null && _a !== void 0 ? _a : ""} ${(_b = s.last_name) !== null && _b !== void 0 ? _b : ""}`.trim() || s.id,
        ];
    }));
    const teacherName = new Map(teachers.map((t) => {
        var _a;
        const row = t;
        const label = ((_a = row.display_name) === null || _a === void 0 ? void 0 : _a.trim()) ||
            [row.first_name, row.last_name].filter(Boolean).join(" ").trim() ||
            row.id;
        return [row.id, label];
    }));
    const studentNameById = Object.fromEntries(studentName);
    const teacherNameById = Object.fromEntries(teacherName);
    const teacherOptionsForRows = teacherOptions.map((t) => {
        var _a;
        const row = t;
        const label = ((_a = row.display_name) === null || _a === void 0 ? void 0 : _a.trim()) ||
            [row.first_name, row.last_name].filter(Boolean).join(" ").trim() ||
            row.id;
        return { id: row.id, label };
    });
    return (_jsxs(CRMLayout, { title: "Enrollment Manager", subtitle: "Start, update, and end student enrollments.", children: [_jsx(CRMNav, { current: "enrollments" }), _jsx(EnrollmentFilters, { currentSort: params.sort, currentDir: params.dir, teachers: teacherOptions.map((t) => {
                    var _a;
                    const row = t;
                    const label = ((_a = row.display_name) === null || _a === void 0 ? void 0 : _a.trim()) ||
                        [row.first_name, row.last_name].filter(Boolean).join(" ").trim() ||
                        row.id;
                    return { id: row.id, label };
                }), students: studentOptions.map((s) => {
                    var _a, _b;
                    return ({
                        id: s.id,
                        label: `${(_a = s.first_name) !== null && _a !== void 0 ? _a : ""} ${(_b = s.last_name) !== null && _b !== void 0 ? _b : ""}`.trim() || s.id,
                    });
                }), currentTeacherId: params.teacherId, currentStudentId: params.studentId, currentStatus: params.status, statuses: statusUnion }), _jsx(EnrollmentActions, {}), rows.length === 0 ? (_jsx(EmptyState, { title: "No enrollments found" })) : (_jsx(EnrollmentsListClient, { rows: rows, studentNameById: studentNameById, teacherNameById: teacherNameById, teacherOptions: teacherOptionsForRows, statuses: statusUnion }))] }));
}
