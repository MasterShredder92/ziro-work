import type {
  Family,
  FamilyInsert,
  FamilyUpdate,
  Lead,
  LeadInsert,
  LeadUpdate,
  Student,
  StudentInsert,
  StudentUpdate,
  Teacher,
  TeacherInsert,
  TeacherUpdate,
  Database,
} from "./entities";

export type {
  Family,
  FamilyInsert,
  FamilyUpdate,
  Lead,
  LeadInsert,
  LeadUpdate,
  Student,
  StudentInsert,
  StudentUpdate,
  Teacher,
  TeacherInsert,
  TeacherUpdate,
};

export type Enrollment = Database["public"]["Tables"]["enrollments"]["Row"];
export type EnrollmentInsert = Database["public"]["Tables"]["enrollments"]["Insert"];
export type EnrollmentUpdate = Database["public"]["Tables"]["enrollments"]["Update"];

/**
 * ContactKind — which underlying entity a CRM contact row maps to.
 * Contacts in ZiroWork are a unified surface over leads, students,
 * family primary contacts, and teachers.
 */
export type ContactKind = "lead" | "student" | "family" | "teacher";

/**
 * Normalized Contact shape returned from CRM queries.
 * Source rows are never mutated — facades project into this.
 */
export interface Contact {
  /** Stable composite id: `${kind}:${sourceId}` */
  id: string;
  kind: ContactKind;
  sourceId: string;
  tenantId: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  status: string | null;
  stage: string | null;
  familyId: string | null;
  teacherId: string | null;
  locationId: string | null;
  tags: string[] | null;
  source: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  archived: boolean;
}

export interface ContactFilter {
  kind?: ContactKind | ContactKind[];
  familyId?: string;
  teacherId?: string;
  locationId?: string;
  status?: string;
  stage?: string;
  tag?: string;
  search?: string;
  includeArchived?: boolean;
}

/**
 * Relationship — linkage between a student/contact and a family.
 * Derived from `students.family_id` and `families.primary_contact_name`/
 * `profile_id`. Not a physical table.
 */
export type RelationshipRole =
  | "primary_guardian"
  | "secondary_guardian"
  | "student"
  | "billing_contact"
  | "emergency_contact";

export interface Relationship {
  id: string;
  tenantId: string;
  familyId: string;
  contactId: string;
  contactKind: ContactKind;
  role: RelationshipRole;
  isPrimary: boolean;
  createdAt: string | null;
}

/**
 * Student lifecycle stages — stored in `students.status` column.
 * Mirrors the conceptual funnel described in the CRM OS spec.
 */
export type StudentLifecycleStage =
  | "lead"
  | "prospect"
  | "enrolled"
  | "inactive";

export const STUDENT_LIFECYCLE_STAGES: StudentLifecycleStage[] = [
  "lead",
  "prospect",
  "enrolled",
  "inactive",
];

/** Teacher lifecycle stages — stored in `teachers.status`. */
export type TeacherLifecycleStage =
  | "onboarding"
  | "active"
  | "inactive";

export const TEACHER_LIFECYCLE_STAGES: TeacherLifecycleStage[] = [
  "onboarding",
  "active",
  "inactive",
];

export interface CRMSearchResult {
  contacts: Contact[];
  families: Family[];
  students: Student[];
  teachers: Teacher[];
  leads: Lead[];
}

export interface CRMKpi {
  totalContacts: number;
  activeStudents: number;
  activeTeachers: number;
  families: number;
  openLeads: number;
  enrolledLast30d: number;
}
