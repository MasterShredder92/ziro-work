"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { PageShell } from "@/components/layouts/PageShell";
import { PageTransition } from "@/components/system/PageTransition";
import { TeacherHeader } from "@/components/teachers/TeacherHeader";
import { TeacherStats } from "@/components/teachers/TeacherStats";
import { TeacherStudentList } from "@/components/teachers/TeacherStudentList";
import { useFacadeQuery } from "@/hooks/data/useFacadeQuery";
import { getSupabaseTenant } from "@/lib/data/supabaseTenant";
import { getTeacherById } from "@/lib/data/teachers";
import { useStudents } from "@/hooks/data/useStudents";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

const PAGE = { mode: "offset" as const, page: 1, pageSize: 300 };

export function TeacherDetailClient() {
  const params = useParams();
  const id = String(params?.id ?? "");

  const teacherQuery = useFacadeQuery(
    ["teacher", DEFAULT_TENANT_ID, id],
    React.useCallback(async () => {
      const client = getSupabaseTenant(DEFAULT_TENANT_ID);
      return getTeacherById(client, DEFAULT_TENANT_ID, id);
    }, [id]),
  );

  const rosterQuery = useStudents({
    tenantId: DEFAULT_TENANT_ID,
    page: PAGE,
    teacherId: id,
  });

  const teacher = teacherQuery.data;
  const students = rosterQuery.data?.items ?? [];
  const rosterCount = students.length;

  const capacity = teacher?.max_students ?? Math.max(rosterCount, 1);
  const payrollImpact = rosterCount * 48;

  if (!id) {
    return <PageShell title="Teacher" />;
  }

  if (teacherQuery.isLoading && !teacher) {
    return <PageShell title="Teacher" />;
  }

  if (teacherQuery.error) {
    return (
      <PageShell title="Teacher">
        <p className="text-sm text-[var(--z-danger)]">{teacherQuery.error.message}</p>
      </PageShell>
    );
  }

  if (!teacher) {
    return (
      <PageShell title="Teacher">
        <p className="text-sm text-[var(--z-muted)]">Teacher not found.</p>
      </PageShell>
    );
  }

  return (
    <PageShell title={teacher.name}>
      <PageTransition>
        <div className="space-y-[var(--z-space-8)]">
          <TeacherHeader teacher={teacher} capacity={capacity} payrollImpact={payrollImpact} />
          <TeacherStats
            teacher={teacher}
            capacity={capacity}
            payrollImpact={payrollImpact}
            rosterCount={rosterCount}
          />
          {rosterQuery.error ? (
            <p className="text-sm text-[var(--z-danger)]">{rosterQuery.error.message}</p>
          ) : null}
          <TeacherStudentList students={students} />
        </div>
      </PageTransition>
    </PageShell>
  );
}
