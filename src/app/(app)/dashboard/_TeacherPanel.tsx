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

const LOCATION_COLORS: Record<string, string> = {
  bellevue: "#7c3aed",
  gretna: "#059669",
  omaha: "#2563eb",
  elkhorn: "#d97706",
};

function resolveLocationColor(name: string, fallback: string | null): string {
  const n = (name ?? "").toLowerCase();
  for (const [key, val] of Object.entries(LOCATION_COLORS)) {
    if (n.includes(key)) return val;
  }
  return fallback ?? "#6366f1";
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const AVATAR_COLORS = [
  "#00ff88", "#7c3aed", "#2563eb", "#d97706", "#059669",
  "#ec4899", "#06b6d4", "#f59e0b",
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function TeacherPanel() {
  const [data, setData] = useState<UtilizationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/teacher-utilization", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json?.teachers !== undefined) setData(json as UtilizationData);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const month = new Date().toLocaleString("default", { month: "long" });

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-xl"
            style={{ background: "#1a1a1c", border: "1px solid rgba(255,255,255,0.05)" }}
          />
        ))}
      </div>
    );
  }

  const teachers = data?.teachers ?? [];
  const maxSessions = teachers[0]?.totalSessions ?? 1;

  if (teachers.length === 0) {
    return (
      <p className="py-2 text-xs" style={{ color: "var(--z-muted)" }}>
        No session data for this month yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--z-muted)" }}>
        Sessions MTD · {month} · top {Math.min(teachers.length, 12)}
      </p>

      {teachers.slice(0, 12).map((t, idx) => {
        const barPct = Math.round((t.totalSessions / maxSessions) * 100);
        const color = avatarColor(t.teacherName);

        // build stacked location segments
        const segments = t.byLocation
          .sort((a, b) => b.sessions - a.sessions)
          .map((loc) => ({
            pct: Math.round((loc.sessions / t.totalSessions) * 100),
            color: resolveLocationColor(loc.locationName, loc.locationColor),
            name: loc.locationName,
            sessions: loc.sessions,
          }));

        return (
          <Link
            key={t.teacherId}
            href={`/crm/teachers/${t.teacherId}`}
            className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150 hover:-translate-y-px"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
              (e.currentTarget as HTMLElement).style.borderColor = `${color}44`;
              (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${color}18`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.05)";
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            {/* Rank */}
            <span
              className="w-4 shrink-0 text-right text-[10px] font-bold"
              style={{ color: idx === 0 ? "#00ff88" : "var(--z-muted)" }}
            >
              {idx + 1}
            </span>

            {/* Avatar */}
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold select-none"
              style={{
                background: `radial-gradient(circle at 30% 30%, ${color}55, ${color}22)`,
                color,
                border: `1.5px solid ${color}55`,
                boxShadow: `0 2px 8px ${color}33`,
              }}
            >
              {initials(t.teacherName)}
            </div>

            {/* Name */}
            <span
              className="w-24 shrink-0 truncate text-xs font-semibold transition-colors group-hover:text-[var(--z-accent)]"
              style={{ color: "var(--z-fg)" }}
            >
              {t.teacherName}
            </span>

            {/* Stacked bar */}
            <div className="relative flex h-2 flex-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
              {segments.map((seg, si) => (
                <div
                  key={si}
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${seg.pct}%`,
                    background: seg.color,
                    boxShadow: `0 0 6px ${seg.color}88`,
                  }}
                  title={`${seg.name}: ${seg.sessions}`}
                />
              ))}
            </div>

            {/* Count */}
            <span
              className="w-8 shrink-0 text-right text-xs font-extrabold"
              style={{ color: "var(--z-fg)" }}
            >
              {t.totalSessions}
            </span>
          </Link>
        );
      })}

      {/* Location color legend */}
      <div className="flex flex-wrap gap-2 pt-1">
        {Object.entries(LOCATION_COLORS).map(([loc, color]) => (
          <div key={loc} className="flex items-center gap-1.5">
            <div
              className="h-2 w-2 rounded-full"
              style={{ background: color, boxShadow: `0 0 5px ${color}` }}
            />
            <span className="text-[10px] capitalize font-medium" style={{ color: "var(--z-muted)" }}>
              {loc}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
