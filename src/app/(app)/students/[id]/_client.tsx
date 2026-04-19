"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AgentPanel } from "@/components/agent/AgentPanel";
import { StudentTimeline } from "@/components/students/StudentTimeline";
import { PageHeader } from "@/components/ui/PageHeader";
import { loadStudentSurface, type StudentSurfaceDTO } from "./actions";
import { PageTransition } from "@/components/system/PageTransition";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

function StudentDetailLoaded({ studentId }: { studentId: string }) {
  const [data, setData] = useState<StudentSurfaceDTO | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void loadStudentSurface(studentId, DEFAULT_TENANT_ID).then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (!res.ok) {
        setErr(res.error);
        setData(null);
      } else {
        setErr(null);
        setData(res.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  const agentStatus = useMemo(() => {
    if (!data) return "idle" as const;
    if (data.blockers.length > 0) return "blocked" as const;
    if (data.riskBand === "high") return "blocked" as const;
    return "active" as const;
  }, [data]);

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl space-y-[var(--z-space-8)]" data-tour="student-detail">
        {loading ? <div className="text-sm text-[var(--z-muted)]">Loading…</div> : null}
        {err ? <div className="text-sm text-[var(--z-danger)]">{err}</div> : null}
        {data ? (
          <>
            <PageHeader title={data.studentName} subtitle={`${data.stageName} · ${data.riskBand} risk`} />
            <AgentPanel
              agentName={data.agentDisplayName}
              avatarUrl={null}
              status={agentStatus}
              summary={data.agentSummary}
              nextActions={data.nextActions}
              currentStageName={data.stageName}
              blockers={data.blockers}
            />
            <StudentTimeline events={data.timeline} />
          </>
        ) : null}
      </div>
    </PageTransition>
  );
}

export function StudentDetailClient() {
  const params = useParams();
  const studentId = String(params?.id ?? "");

  if (!studentId) {
    return (
      <div className="h-full overflow-y-auto overflow-x-hidden p-[var(--z-space-6)]">
        <p className="text-sm text-[var(--z-muted)]">Missing student id.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden p-[var(--z-space-6)]">
      <StudentDetailLoaded key={studentId} studentId={studentId} />
    </div>
  );
}
