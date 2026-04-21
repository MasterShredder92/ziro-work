import { computeAdminKpis, computeInvoiceAging, computeScheduleHeatmap, computeTeacherLoad, getAdminInvoices, getAdminLeads, getAdminSchedule, getAdminStudents, getAdminTeachers, } from "./queries";
export async function getAdminDashboard(tenantId) {
    const [leads, students, teachers, invoices, schedule] = await Promise.all([
        getAdminLeads(tenantId),
        getAdminStudents(tenantId),
        getAdminTeachers(tenantId),
        getAdminInvoices(tenantId),
        getAdminSchedule(tenantId),
    ]);
    const kpis = computeAdminKpis(tenantId, leads, students, teachers, invoices, schedule);
    const aging = computeInvoiceAging(invoices);
    const heatmap = computeScheduleHeatmap(schedule);
    const teacherLoad = computeTeacherLoad(teachers, students, schedule);
    return {
        kpis,
        leads,
        students,
        teachers,
        invoices,
        schedule,
        aging,
        heatmap,
        teacherLoad,
    };
}
