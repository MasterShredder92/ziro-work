import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import type { DirectorDashboardData } from "./types";
import {
  getDirectorBilling,
  getDirectorKpis,
  getDirectorLeads,
  getDirectorLocation,
  getDirectorSchedule,
  getDirectorStudents,
  getDirectorTeachers,
} from "./queries";

export async function getDirectorDashboard(
  locationId: string,
  tenantId: string = DEFAULT_TENANT_ID,
): Promise<DirectorDashboardData> {
  const [location, leads, students, teachers, schedule, billing] =
    await Promise.all([
      getDirectorLocation(tenantId, locationId),
      getDirectorLeads(tenantId, locationId),
      getDirectorStudents(tenantId, locationId),
      getDirectorTeachers(tenantId, locationId),
      getDirectorSchedule(tenantId, locationId),
      getDirectorBilling(tenantId, locationId),
    ]);

  const kpis = await getDirectorKpis(tenantId, locationId, {
    leads,
    students,
    teachers,
    schedule,
    billing,
  });

  return {
    location,
    kpis,
    leads,
    students,
    teachers,
    schedule,
    billing,
    generatedAt: new Date().toISOString(),
  };
}
