"use client";

import Link from "next/link";
import type { Student, Teacher } from "@/lib/data/models";
import { TeacherHeader } from "@/components/teachers/TeacherHeader";
import { TeacherStats } from "@/components/teachers/TeacherStats";
import { TeacherStudentList } from "@/components/teachers/TeacherStudentList";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

const now = new Date().toISOString();

const teacher: Teacher = {
  id: "demo-teacher-view",
  tenant_id: DEFAULT_TENANT_ID,
  created_at: now,
  name: "Skyler Monroe",
  email: "skyler@example.com",
  phone: null,
  status: "active",
  max_students: 20,
  weekly_capacity_minutes: 840,
  notes: null,
  archived_at: null,
};

const students = [
  {
    id: "demo-student-a",
    tenant_id: DEFAULT_TENANT_ID,
    created_at: now,
    family_id: null,
    teacher_id: teacher.id,
    name: "Jamie Cole",
    email: "jamie@example.com",
    phone: null,
    date_of_birth: null,
    status: "active",
    enrollment_date: now,
    onboarding_stage: "active",
    last_attendance_at: now,
    attendance_streak: 3,
    churn_risk: null,
    notes: null,
    archived_at: null,
  },
  {
    id: "demo-student-b",
    tenant_id: DEFAULT_TENANT_ID,
    created_at: now,
    family_id: null,
    teacher_id: teacher.id,
    name: "Reese Nova",
    email: null,
    phone: null,
    date_of_birth: null,
    status: "paused",
    enrollment_date: now,
    onboarding_stage: "at_risk",
    last_attendance_at: null,
    attendance_streak: 0,
    churn_risk: "churn_watch",
    notes: null,
    archived_at: null,
  },
];

export default function SandboxTeacherPage() {
  const rosterCount = students.length;
  const capacity = teacher.max_students ?? rosterCount;
  const payrollImpact = rosterCount * 48;

  return (
    <div className="space-y-[var(--z-space-8)]">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">Teacher view</h1>
        <Link className="text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]" href="/sandbox">
          Back
        </Link>
      </div>
      <p className="text-sm text-[var(--z-muted)]">Static composition for header, stats, and roster list.</p>

      <TeacherHeader teacher={teacher} capacity={capacity} payrollImpact={payrollImpact} />
      <TeacherStats
        teacher={teacher}
        capacity={capacity}
        payrollImpact={payrollImpact}
        rosterCount={rosterCount}
      />
      <TeacherStudentList students={students as Student[]} />
    </div>
  );
}
