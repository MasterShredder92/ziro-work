"use client";

import Link from "next/link";
import type { Student } from "@/lib/data/models";
import { List } from "@/components/ui/List";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/components/ui/utils/cn";

export type TeacherStudentListProps = {
  students: Student[];
  className?: string;
};

function statusVariant(status: Student["status"]) {
  if (status === "active") return "success" as const;
  if (status === "paused") return "warning" as const;
  return "neutral" as const;
}

function nextLessonLabel(s: Student) {
  if (s.last_attendance_at) {
    const d = new Date(s.last_attendance_at);
    if (!Number.isNaN(d.getTime())) {
      const next = new Date(d);
      next.setDate(next.getDate() + 7);
      return `Target window ${next.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
    }
  }
  if (s.enrollment_date) {
    const d = new Date(s.enrollment_date);
    if (!Number.isNaN(d.getTime())) {
      return `Enrolled ${d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
    }
  }
  return "Schedule pending";
}

function riskBadge(risk: string | null, stage: Student["onboarding_stage"]) {
  const label = risk?.trim() || stage || "Stable";
  const lower = label.toLowerCase();
  if (lower.includes("risk") || lower.includes("churn") || lower.includes("at_risk")) {
    return <Badge variant="danger">At risk</Badge>;
  }
  if (lower.includes("pause") || lower.includes("watch")) {
    return <Badge variant="warning">Watch</Badge>;
  }
  return <Badge variant="neutral">Stable</Badge>;
}

export function TeacherStudentList({ students, className }: TeacherStudentListProps) {
  const items = students.map((s) => ({
    id: s.id,
    title: (
      <Link href={`/students/${s.id}`} className="hover:text-[var(--z-accent)]">
        {s.name}
      </Link>
    ),
    description: (
      <div className="flex flex-col gap-1">
        <div className="text-xs text-[var(--z-muted)]">{nextLessonLabel(s)}</div>
      </div>
    ),
    action: (
      <div className="flex flex-col items-end gap-1">
        <Badge variant={statusVariant(s.status)} active={s.status === "active"}>
          {s.status}
        </Badge>
        {riskBadge(s.churn_risk, s.onboarding_stage)}
      </div>
    ),
  }));

  return (
    <div className={cn("space-y-[var(--z-space-3)]", className)}>
      <div className="text-sm font-semibold text-[var(--z-fg)]">Students</div>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--z-muted)]">No students assigned.</p>
      ) : (
        <List items={items} />
      )}
    </div>
  );
}
