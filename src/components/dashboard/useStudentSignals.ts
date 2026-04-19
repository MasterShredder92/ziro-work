"use client";

import { useMemo, useEffect, useState } from "react";
import { useEvents, useStudents } from "@/hooks/data";
import { DASHBOARD_TENANT_ID } from "./constants";

export type StudentSignals = {
  atRiskStudents: number;
  pendingEnrollments: number;
  newLeadsWeek: number;
};

function isLeadEvent(eventType: string): boolean {
  return /lead|intake|trial_scheduled/i.test(eventType);
}

export function useStudentSignals(): {
  signals: StudentSignals;
  loading: boolean;
  error: Error | null;
} {
  const tenantId = DASHBOARD_TENANT_ID;
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    queueMicrotask(() => setNowMs(Date.now()));
  }, []);

  const studentParams = useMemo(
    () => ({
      tenantId,
      page: { mode: "offset" as const, page: 1, pageSize: 250 },
    }),
    [tenantId],
  );

  const eventParams = useMemo(
    () => ({
      tenantId,
      page: { mode: "offset" as const, page: 1, pageSize: 120 },
    }),
    [tenantId],
  );

  const { data: stuData, error: stuErr, isLoading: stuLoading } = useStudents(studentParams);
  const { data: evData, error: evErr, isLoading: evLoading } = useEvents(eventParams);

  const signals = useMemo(() => {
    const students = stuData?.items ?? [];
    const events = evData?.items ?? [];
    const now = nowMs ?? 0;
    const weekMs = 7 * 24 * 60 * 60 * 1000;

    const pendingEnrollments = students.filter(
      (s) => s.status === "active" && s.onboarding_stage === "new",
    ).length;

    const atRiskStudents = students.filter(
      (s) =>
        s.onboarding_stage === "at_risk" ||
        (s.churn_risk && String(s.churn_risk).toLowerCase() === "high"),
    ).length;

    const newLeadsWeek =
      nowMs == null
        ? 0
        : events.filter((e) => {
            const t = new Date(e.created_at).getTime();
            if (!Number.isFinite(t) || now - t > weekMs) return false;
            return isLeadEvent(e.event_type);
          }).length;

    return { atRiskStudents, pendingEnrollments, newLeadsWeek };
  }, [stuData, evData, nowMs]);

  const error = stuErr ?? evErr ?? null;

  return {
    signals,
    loading: stuLoading || evLoading,
    error: error instanceof Error ? error : error ? new Error(String(error)) : null,
  };
}
