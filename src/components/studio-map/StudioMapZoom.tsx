"use client";

import * as React from "react";
import Link from "next/link";
import type { ScheduleWindow } from "@/lib/schedule/window";
import type { StudioMapLocationPayload } from "@/app/api/studio-map/location/route";
import type { StudioMapRosterStudent } from "@/app/api/studio-map/roster/route";
import type { Teacher } from "@/lib/types/entities";
import type { StudentStatus } from "@/lib/data/models/students";

// ─── Location color palette ───────────────────────────────────────────────────
const LOCATION_COLORS: Record<string, { color: string; glow: string }> = {
  "f7b52dd5-12ee-437f-9c60-f8adf454ac31": { color: "#7C3AED", glow: "rgba(124,58,237,0.35)" },
  "40c67ffc-91b5-46a9-94bd-6ddffdfb7638": { color: "#16A34A", glow: "rgba(22,163,74,0.35)"  },
  "cebd97d4-c241-4de2-8ade-49e5cc0070d5": { color: "#0EA5E9", glow: "rgba(14,165,233,0.35)" },
  "d48229c1-b70a-4d29-893e-5079887dab76": { color: "#DC2626", glow: "rgba(220,38,38,0.35)"  },
};
const DEFAULT_LOC_COLOR = { color: "#6366f1", glow: "rgba(99,102,241,0.35)" };

function getLocColor(id: string) {
  return LOCATION_COLORS[id] ?? DEFAULT_LOC_COLOR;
}

function teacherDisplayName(t: Teacher): string {
  const first = (t.first_name ?? "").trim();
  const last = (t.last_name ?? "").trim();
  return `${first} ${last}`.trim() || "Teacher";
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";
}

// ─── Student chip ─────────────────────────────────────────────────────────────
function StudentChip({ student }: { student: StudioMapRosterStudent }) {
  const active = student.status === "active";
  return (
    <Link
      href={`/students/${student.id}`}
      className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-all hover:-translate-y-0.5"
      style={{
        borderColor: active ? "rgba(52,211,153,0.4)" : "var(--z-border)",
        background: active ? "rgba(52,211,153,0.06)" : "var(--z-surface-2)",
        opacity: active ? 1 : 0.6,
      }}
    >
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
        style={{
          background: active ? "rgba(52,211,153,0.18)" : "var(--z-surface)",
          color: active ? "#34d399" : "var(--z-muted)",
        }}
      >
        {initials(student.name)}
      </span>
      <span className="truncate font-medium text-[var(--z-fg)]">{student.name}</span>
      {!active && (
        <span className="ml-auto shrink-0 rounded-full bg-[var(--z-surface)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--z-muted)]">
          {student.status}
        </span>
      )}
    </Link>
  );
}

// ─── Teacher card (inside expanded location) ──────────────────────────────────
function TeacherCard({
  teacher,
  locationId,
  scheduleWindow,
}: {
  teacher: Teacher;
  locationId: string;
  scheduleWindow: ScheduleWindow;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const [students, setStudents] = React.useState<StudioMapRosterStudent[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const name = teacherDisplayName(teacher);

  const handleToggle = async () => {
    if (!expanded && students === null) {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/studio-map/roster?teacherId=${encodeURIComponent(teacher.id)}&locationId=${encodeURIComponent(locationId)}&start=${scheduleWindow.start}&end=${scheduleWindow.end}`,
        );
        if (res.ok) {
          const data = await res.json() as { students: StudioMapRosterStudent[] };
          setStudents(data.students ?? []);
        } else {
          setStudents([]);
        }
      } catch {
        setStudents([]);
      } finally {
        setLoading(false);
      }
    }
    setExpanded((prev) => !prev);
  };

  const instruments = teacher.instruments?.join(", ") ?? "";

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--z-border)" }}>
      <button
        onClick={handleToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.02]"
        style={{ background: "var(--z-surface)" }}
      >
        {/* Avatar */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold"
          style={{
            borderColor: "var(--z-border)",
            background: "var(--z-surface-2)",
            color: "var(--z-accent)",
          }}
        >
          {initials(name)}
        </div>
        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-[var(--z-fg)]">{name}</div>
          {instruments && (
            <div className="truncate text-[11px] text-[var(--z-muted)]">{instruments}</div>
          )}
        </div>
        {/* Expand indicator */}
        <svg
          className={`h-3 w-3 shrink-0 transition-transform text-[var(--z-muted)] ${expanded ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Student roster */}
      {expanded && (
        <div
          className="border-t px-4 py-3"
          style={{ borderColor: "var(--z-border)", background: "var(--z-surface-2)" }}
        >
          {loading ? (
            <p className="text-xs text-[var(--z-muted)]">Loading roster…</p>
          ) : students === null || students.length === 0 ? (
            <p className="text-xs text-[var(--z-muted)]">No students on this roster.</p>
          ) : (
            <div className="space-y-1.5">
              {students.map((s) => (
                <StudentChip key={s.id} student={s} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Expanded location view ───────────────────────────────────────────────────
function LocationExpanded({
  locationId,
  locationName,
  bundle,
  loading,
  scheduleWindow,
  onBack,
}: {
  locationId: string;
  locationName: string;
  bundle: StudioMapLocationPayload | null;
  loading: boolean;
  scheduleWindow: ScheduleWindow;
  onBack: () => void;
}) {
  const { color, glow } = getLocColor(locationId);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[var(--z-muted)] transition-colors hover:text-[var(--z-fg)]"
          style={{ borderColor: "var(--z-border)", background: "var(--z-surface)" }}
          aria-label="Back to overview"
        >
          ←
        </button>
        <div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ background: color, boxShadow: `0 0 8px ${glow}` }}
            />
            <h2 className="text-xl font-bold" style={{ color }}>{locationName}</h2>
          </div>
          {bundle && (
            <p className="text-xs text-[var(--z-muted)]">
              {bundle.stats.teacherCount} teacher{bundle.stats.teacherCount !== 1 ? "s" : ""} ·{" "}
              {bundle.stats.roomCount} room{bundle.stats.roomCount !== 1 ? "s" : ""} ·{" "}
              {bundle.stats.openSlotCount} open slot{bundle.stats.openSlotCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <Link
          href={`/schedule?locationId=${locationId}`}
          className="ml-auto rounded-full px-3 py-1.5 text-xs font-bold transition-colors"
          style={{
            background: `${color}22`,
            color,
            border: `1px solid ${color}44`,
          }}
        >
          View schedule →
        </Link>
      </div>

      {/* Teachers */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-xl"
              style={{ background: "var(--z-surface)" }}
            />
          ))}
        </div>
      ) : !bundle || bundle.teachers.length === 0 ? (
        <div className="rounded-xl border border-[var(--z-border)] px-6 py-10 text-center text-sm text-[var(--z-muted)]">
          No teachers at this location.
        </div>
      ) : (
        <div className="space-y-2">
          {bundle.teachers.map((teacher) => (
            <TeacherCard
              key={teacher.id}
              teacher={teacher}
              locationId={locationId}
              scheduleWindow={scheduleWindow}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Location overview card ───────────────────────────────────────────────────
function LocationCard({
  location,
  isGreyedOut,
  onClick,
}: {
  location: { id: string; name: string };
  isGreyedOut: boolean;
  onClick: () => void;
}) {
  const { color, glow } = getLocColor(location.id);

  return (
    <button
      onClick={onClick}
      className="group relative flex w-full flex-col items-start gap-3 overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300"
      style={{
        borderColor: isGreyedOut ? "var(--z-border)" : `${color}55`,
        background: isGreyedOut
          ? "var(--z-surface)"
          : `linear-gradient(135deg, color-mix(in oklab, var(--z-surface), transparent 5%) 0%, color-mix(in oklab, var(--z-surface-2), transparent 30%) 100%)`,
        boxShadow: isGreyedOut ? "none" : `0 0 0 1px ${color}22, 0 8px 32px ${glow}`,
        opacity: isGreyedOut ? 0.4 : 1,
        transform: isGreyedOut ? "scale(0.97)" : "scale(1)",
      }}
    >
      {/* Glow blob */}
      {!isGreyedOut && (
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20 blur-2xl transition-opacity duration-300 group-hover:opacity-30"
          style={{ background: color }}
        />
      )}

      {/* Color dot + name */}
      <div className="relative flex items-center gap-2">
        <span
          className="inline-block h-3 w-3 rounded-full transition-all duration-300"
          style={{
            background: color,
            boxShadow: isGreyedOut ? "none" : `0 0 8px ${glow}`,
          }}
        />
        <span
          className="text-base font-bold transition-colors duration-300"
          style={{ color: isGreyedOut ? "var(--z-muted)" : color }}
        >
          {location.name}
        </span>
      </div>

      {/* CTA */}
      {!isGreyedOut && (
        <div className="relative text-[11px] font-semibold text-[var(--z-muted)] transition-colors group-hover:text-[var(--z-fg)]">
          Click to explore →
        </div>
      )}
    </button>
  );
}

// ─── Overview: all 4 location cards ──────────────────────────────────────────
function LocationOverview({
  companyName,
  locations,
  onSelectLocation,
}: {
  companyName: string;
  locations: Array<{ id: string; name: string }>;
  onSelectLocation: (id: string) => void;
}) {
  return (
    <div className="animate-in fade-in duration-300">
      {/* Studio header */}
      <div className="mb-6 flex flex-col items-center gap-1 text-center">
        <div
          className="mb-2 flex h-14 w-14 items-center justify-center rounded-full border-2 text-lg font-black"
          style={{
            borderColor: "rgba(245,158,11,0.5)",
            background: "radial-gradient(circle at 38% 32%, rgba(245,158,11,0.15) 0%, var(--z-surface-2) 70%)",
            boxShadow: "0 0 24px rgba(245,158,11,0.25)",
            color: "#f59e0b",
          }}
        >
          {initials(companyName)}
        </div>
        <h2 className="text-lg font-bold text-[var(--z-fg)]">{companyName}</h2>
        <p className="text-xs text-[var(--z-muted)]">
          {locations.length} location{locations.length !== 1 ? "s" : ""} — click one to explore
        </p>
      </div>

      {/* Location grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {locations.map((loc) => (
          <LocationCard
            key={loc.id}
            location={loc}
            isGreyedOut={false}
            onClick={() => onSelectLocation(loc.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main StudioMapZoom component ─────────────────────────────────────────────
export type StudioMapZoomProps = {
  companyName: string;
  locations: Array<{ id: string; name: string }>;
  scheduleWindow: ScheduleWindow;
  initialFocusLocationId: string | null;
};

export function StudioMapZoom({
  companyName,
  locations,
  scheduleWindow,
  initialFocusLocationId,
}: StudioMapZoomProps) {
  const [focusedId, setFocusedId] = React.useState<string | null>(initialFocusLocationId);
  const [bundles, setBundles] = React.useState<Record<string, StudioMapLocationPayload>>({});
  const [loadingId, setLoadingId] = React.useState<string | null>(null);

  // Fetch location bundle when a location is selected
  const handleSelectLocation = React.useCallback(
    async (locationId: string) => {
      setFocusedId(locationId);
      if (bundles[locationId]) return; // already fetched

      setLoadingId(locationId);
      try {
        const res = await fetch(
          `/api/studio-map/location?locationId=${encodeURIComponent(locationId)}&start=${scheduleWindow.start}&end=${scheduleWindow.end}`,
        );
        if (res.ok) {
          const data = await res.json() as StudioMapLocationPayload;
          setBundles((prev) => ({ ...prev, [locationId]: data }));
        }
      } catch {
        // silently fail — show empty state
      } finally {
        setLoadingId(null);
      }
    },
    [bundles, scheduleWindow],
  );

  // Auto-fetch initial focus location
  React.useEffect(() => {
    if (initialFocusLocationId && !bundles[initialFocusLocationId]) {
      handleSelectLocation(initialFocusLocationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const focusedLocation = focusedId ? locations.find((l) => l.id === focusedId) : null;

  if (focusedId && focusedLocation) {
    return (
      <LocationExpanded
        locationId={focusedId}
        locationName={focusedLocation.name}
        bundle={bundles[focusedId] ?? null}
        loading={loadingId === focusedId}
        scheduleWindow={scheduleWindow}
        onBack={() => setFocusedId(null)}
      />
    );
  }

  return (
    <LocationOverview
      companyName={companyName}
      locations={locations}
      onSelectLocation={handleSelectLocation}
    />
  );
}
