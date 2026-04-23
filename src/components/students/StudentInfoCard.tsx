"use client";

import type { Family, Student, Teacher } from "@/lib/data/models";
import { Card } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/components/ui/utils/cn";

export type StudentInfoCardProps = {
  student: Student;
  family: Family | null;
  teacher: Teacher | null;
  className?: string;
};

export function StudentInfoCard({ student, family, teacher, className }: StudentInfoCardProps) {
  return (
    <Card variant="elevated" padding="lg" radius="lg" shadow="sm" className={cn(className)}>
      <Section title="Profile" accent spacing="tight">
        <div className="grid grid-cols-1 gap-[var(--z-space-4)] sm:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]">Student</div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <div className="text-lg font-semibold text-[var(--z-fg)]">{student.name}</div>
              <Badge variant={student.status === "active" ? "success" : "neutral"} active={student.status === "active"}>
                {student.status}
              </Badge>
            </div>
            <div className="mt-2 space-y-1 text-sm text-[var(--z-muted)]">
              {student.date_of_birth ? <div>DOB {student.date_of_birth}</div> : null}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]">Family</div>
            <div className="mt-1 text-sm text-[var(--z-fg)]">
              {family ? (
                <>
                  <div className="font-semibold">{family.name}</div>
                  <div className="mt-1 space-y-0.5 text-[var(--z-muted)]">
                    {family.primary_email ? <div>{family.primary_email}</div> : null}
                    {family.primary_phone ? <div>{family.primary_phone}</div> : null}
                  </div>
                </>
              ) : (
                <span className="text-[var(--z-muted)]">No family linked</span>
              )}
            </div>
            <div className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]">Teacher</div>
            <div className="mt-1 text-sm font-semibold text-[var(--z-fg)]">
              {teacher ? teacher.name : <span className="font-normal text-[var(--z-muted)]">Unassigned</span>}
            </div>
          </div>
        </div>
      </Section>
    </Card>
  );
}
