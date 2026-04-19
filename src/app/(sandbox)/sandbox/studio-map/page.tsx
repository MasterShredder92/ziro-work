"use client";

import Link from "next/link";
import * as React from "react";
import { StudioMapClassic } from "@/components/studio-map/StudioMapClassic";
import type { Student, Teacher } from "@/lib/data/models";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

const now = new Date().toISOString();

const demoTeachers: Teacher[] = [
  {
    id: "demo-teacher-1",
    tenant_id: DEFAULT_TENANT_ID,
    created_at: now,
    name: "Morgan Lee",
    email: "morgan@example.com",
    phone: null,
    status: "active",
    max_students: 24,
    weekly_capacity_minutes: 960,
    notes: null,
    archived_at: null,
  },
  {
    id: "demo-teacher-2",
    tenant_id: DEFAULT_TENANT_ID,
    created_at: now,
    name: "Riley Park",
    email: "riley@example.com",
    phone: null,
    status: "active",
    max_students: 18,
    weekly_capacity_minutes: 720,
    notes: null,
    archived_at: null,
  },
];

const demoStudents: Record<string, Pick<Student, "id" | "name" | "status">[]> = {
  "demo-teacher-1": [
    { id: "demo-s-1", name: "Alex Rivera", status: "active" },
    { id: "demo-s-2", name: "Jordan Blake", status: "active" },
    { id: "demo-s-3", name: "Casey Frost", status: "paused" },
  ],
  "demo-teacher-2": [{ id: "demo-s-4", name: "Taylor Kim", status: "inactive" }],
};

export default function SandboxStudioMapPage() {
  const [expandedTeacherId, setExpandedTeacherId] = React.useState<string | null>(null);

  const teachers = demoTeachers.map((teacher) => ({
    teacher,
    studentCount: demoStudents[teacher.id]?.length ?? 0,
  }));

  const studentsForExpanded =
    expandedTeacherId && demoStudents[expandedTeacherId] ? demoStudents[expandedTeacherId] : null;

  return (
    <div className="space-y-[var(--z-space-6)]">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">Studio Map</h1>
        <Link className="text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]" href="/sandbox">
          Back
        </Link>
      </div>
      <p className="text-sm text-[var(--z-muted)]">Visual QA with static fixtures (no network calls).</p>

      <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface-2)]">
        <StudioMapClassic
          studioLabel="Studio"
          teachers={teachers}
          expandedTeacherId={expandedTeacherId}
          onTeacherToggle={(tid) => setExpandedTeacherId((cur) => (cur === tid ? null : tid))}
          studentsForExpandedTeacher={studentsForExpanded}
          expandedStudentsLoading={false}
        />
      </div>
    </div>
  );
}
