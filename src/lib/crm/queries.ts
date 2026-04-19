/**
 * Read-side queries for the CRM OS. Wraps the tenant-scoped @data
 * facades and the unified contact projection.
 */
import { listContacts, getContactById } from "@data/contacts";
import { listStudents, type StudentFilter } from "@data/students";
import { listFamilies, type FamilyFilter } from "@data/families";
import { listTeachers, type ListTeachersFilter } from "@data/teachers";
import { listLeads, type LeadFilter } from "@data/leads";
import { listEnrollments, type EnrollmentFilter } from "@data/enrollments";
import type {
  CRMSearchResult,
  ContactFilter,
  Enrollment,
  Family,
  Lead,
  Student,
  Teacher,
} from "@/lib/types/crm";

export {
  listContacts,
  getContactById,
  listEnrollments,
};
export type { EnrollmentFilter };

export async function listStudentsScoped(
  tenantId: string,
  filter?: StudentFilter,
): Promise<Student[]> {
  return listStudents(tenantId, filter);
}

export async function listFamiliesScoped(
  tenantId: string,
  filter?: FamilyFilter,
): Promise<Family[]> {
  return listFamilies(tenantId, filter);
}

export async function listTeachersScoped(
  tenantId: string,
  filter?: ListTeachersFilter,
): Promise<Teacher[]> {
  const rows = await listTeachers(tenantId, filter);
  return rows as unknown as Teacher[];
}

export async function listLeadsScoped(
  tenantId: string,
  filter?: LeadFilter,
): Promise<Lead[]> {
  return listLeads(tenantId, filter);
}

/**
 * Unified CRM search — fans out to contacts, families, teachers, students,
 * and leads for the given tenant and term.
 */
export async function searchCRM(
  tenantId: string,
  term: string,
  opts?: { includeArchived?: boolean; limit?: number },
): Promise<CRMSearchResult> {
  const limit = opts?.limit ?? 50;
  const search = term.trim();
  const filter: ContactFilter = {
    search,
    includeArchived: opts?.includeArchived,
  };
  const contacts = await listContacts(tenantId, filter, limit * 4);

  const families: Family[] = [];
  const students: Student[] = [];
  const teachers: Teacher[] = [];
  const leads: Lead[] = [];
  for (const c of contacts) {
    if (c.kind === "family") {
      // Look up full family row lazily if needed; projection suffices for now.
    }
    if (c.kind === "student") {
      students.push({
        id: c.sourceId,
        tenant_id: c.tenantId,
        first_name: c.firstName ?? "",
        last_name: c.lastName ?? "",
        email: c.email,
        phone: c.phone,
        status: c.status ?? "",
        family_id: c.familyId,
        teacher_id: c.teacherId,
        location_id: c.locationId,
        tags: c.tags,
        source: c.source,
        created_at: c.createdAt ?? "",
        updated_at: c.updatedAt ?? "",
      } as Student);
    }
    if (c.kind === "teacher") {
      teachers.push({
        id: c.sourceId,
        tenant_id: c.tenantId,
        first_name: c.firstName ?? null,
        last_name: c.lastName ?? null,
        email: c.email,
        phone: c.phone,
        instruments: [],
        is_active: !c.archived,
        created_at: c.createdAt ?? "",
        updated_at: c.updatedAt ?? "",
      } as unknown as Teacher);
    }
    if (c.kind === "family") {
      families.push({
        id: c.sourceId,
        tenant_id: c.tenantId,
        name: c.fullName,
        primary_email: c.email,
        primary_phone: c.phone,
        primary_location_id: c.locationId,
        billing_status: c.status ?? "",
        created_at: c.createdAt ?? "",
        updated_at: c.updatedAt ?? "",
      } as unknown as Family);
    }
    if (c.kind === "lead") {
      leads.push({
        id: c.sourceId,
        tenant_id: c.tenantId,
        first_name: c.firstName ?? "",
        last_name: c.lastName,
        email: c.email,
        phone: c.phone,
        stage: c.stage,
        family_id: c.familyId,
        location_id: c.locationId,
        source: c.source,
        created_at: c.createdAt ?? "",
        updated_at: c.updatedAt ?? "",
      } as unknown as Lead);
    }
  }

  return { contacts: contacts.slice(0, limit), families, students, teachers, leads };
}

export async function getCRMKpis(tenantId: string) {
  const [students, teachers, families, leads, enrollments] = await Promise.all([
    listStudents(tenantId, undefined, { limit: 1000 }),
    listTeachers(tenantId, undefined, { limit: 1000 }),
    listFamilies(tenantId, undefined, { limit: 1000 }),
    listLeads(tenantId, undefined, { limit: 1000 }),
    listEnrollments(tenantId, undefined, { limit: 1000 }),
  ]);
  const thirtyDaysAgo = Date.now() - 30 * 86400000;
  const enrolledLast30d = (enrollments as Enrollment[]).filter((e) => {
    if (!e.start_date) return false;
    return new Date(e.start_date).getTime() >= thirtyDaysAgo;
  }).length;
  const activeEnrollments = (enrollments as Enrollment[]).filter(
    (e) => e.status === "active",
  ).length;
  const isTeacherActive = (t: (typeof teachers)[number]) => {
    const row = t as unknown as { status?: string; is_active?: boolean };
    return row.status === "active" || row.is_active === true;
  };
  return {
    totalContacts:
      students.length + teachers.length + families.length + leads.length,
    activeStudents: students.filter((s) => s.status === "enrolled").length,
    activeTeachers: teachers.filter(isTeacherActive).length,
    families: families.length,
    openLeads: leads.filter((l) => l.stage !== "lost" && l.stage !== "enrolled")
      .length,
    enrolledLast30d,
    activeEnrollments,
  };
}
