"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type TeacherRow = {
  teacherId: string;
  teacherName: string;
  totalSessions: number;
  bookedSessions: number;
  byLocation: {
    locationId: string;
    locationName: string;
    locationColor: string | null;
    sessions: number;
  }[];
};

type UtilizationData = {
  teachers: TeacherRow[];
  mtd: { start: string; end: string };
};

export function TeacherUtilization() {
  const [data, setData] = useState<UtilizationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/teacher-utilization", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json?.teachers !== undefined) {
          setData(json as UtilizationData);
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-8 animate-pulse rounded-lg bg-[var(--z-surface-2)]" />
        ))}
      </div>
    );
  }

  const teachers = data?.teachers ?? [];
  const maxSessions = teachers[0]?.totalSessions ?? 1;

  if (teachers.length === 0) {
    return (
      <p className="py-2 text-xs text-[color-mix(in_oklab,var(--z-fg),transparent_55%)]">
        No session data for this month yet.
      </p>
    );
  }

  const monthLabel = new Date().toLocaleString("default", { month: "long" });

  return (
    <div className="space-y-1">
      <p className="pb-1 text-[11px] text-[color-mix(in_oklab,var(--z-fg),transparent_45%)]">
        Student sessions · {monthLabel} · top {Math.min(teachers.length, 15)}
      </p>
      {teachers.slice(0, 15).map((t, idx) => {
        const barPct = Math.round((t.totalSessions / maxSessions) * 100);
        return (
          <Link
            key={t.teacherId}
            href={`/teachers/${t.teacherId}`}
            className="group flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-[color-mix(in_oklab,var(--z-surface-2),transparent_30%)]"
          >
            {/* Rank */}
            <span className="w-4 shrink-0 text-right text-[10px] text-[var(--z-muted)]">
              {idx + 1}
            </span>

            {/* Name */}
            <span className="w-28 shrink-0 truncate text-xs font-medium text-[var(--z-fg)] group-hover:text-[var(--z-accent)]">
              {t.teacherName}
            </span>

            {/* Mini bar */}
            <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--z-border),transparent_20%)]">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-[var(--z-accent)] opacity-70 transition-all duration-300"
                style={{ width: `${barPct}%` }}
              />
            </div>

            {/* Count */}
            <span className="w-8 shrink-0 text-right text-xs font-bold text-[var(--z-fg)]">
              {t.totalSessions}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
