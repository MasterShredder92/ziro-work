"use client";
import * as React from "react";
import Link from "next/link";
import type { ScheduleBlock, Student, Teacher } from "@/lib/types/entities";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toLabel(value: string | null | undefined): string {
  if (!value) return "";
  const [h = "0", m = "0"] = value.split(":");
  const h24 = Number(h);
  const hour = h24 % 12 || 12;
  const suffix = h24 >= 12 ? "PM" : "AM";
  return `${hour}:${m.padStart(2, "0")} ${suffix}`;
}

function teacherName(teacher: Teacher | undefined | null): string {
  if (!teacher) return "Staff";
  const t = teacher as unknown as Record<string, unknown>;
  const first = typeof t.first_name === "string" ? t.first_name.trim() : "";
  const last = typeof t.last_name === "string" ? t.last_name.trim() : "";
  return `${first} ${last}`.trim() || "Staff";
}

function studentName(student: Student | undefined | null): string {
  if (!student) return "Student";
  const s = student as unknown as Record<string, unknown>;
  const first = typeof s.first_name === "string" ? s.first_name.trim() : "";
  const last = typeof s.last_name === "string" ? s.last_name.trim() : "";
  return `${first} ${last}`.trim() || "Student";
}

// Block type → human label
const BLOCK_TYPE_LABELS: Record<string, string> = {
  student_session: "Booked Session",
  first_day:       "First Day",
  last_day:        "Last Day",
  call_out:        "Call Out",
  makeup_session:  "Makeup Session",
  meet_greet:      "Meet & Greet",
  sub:             "Sub",
  teacher_training:"Training",
  not_bookable:    "Locked Time",
  open_time:       "Open Slot",
  virtual:         "Virtual Session",
};

// Block type → accent color for the status pill
const BLOCK_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  student_session: { bg: "rgba(234,179,8,0.15)",   text: "#fbbf24" },
  first_day:       { bg: "rgba(59,130,246,0.15)",  text: "#60a5fa" },
  last_day:        { bg: "rgba(239,68,68,0.15)",   text: "#f87171" },
  call_out:        { bg: "rgba(249,115,22,0.15)",  text: "#fb923c" },
  makeup_session:  { bg: "rgba(236,72,153,0.15)",  text: "#f472b6" },
  meet_greet:      { bg: "rgba(20,184,166,0.15)",  text: "#2dd4bf" },
  sub:             { bg: "rgba(34,197,94,0.15)",   text: "#4ade80" },
  teacher_training:{ bg: "rgba(139,92,246,0.15)",  text: "#a78bfa" },
  not_bookable:    { bg: "rgba(107,114,128,0.15)", text: "#9ca3af" },
  open_time:       { bg: "rgba(16,185,129,0.15)",  text: "#34d399" },
  virtual:         { bg: "rgba(14,165,233,0.15)",  text: "#38bdf8" },
};

// ─── Types ────────────────────────────────────────────────────────────────────
export type ScheduleBlockModalData = {
  block: ScheduleBlock;
  student: Student | null | undefined;
  teacher: Teacher | null | undefined;
  locationName: string;
};

type Props = {
  data: ScheduleBlockModalData | null;
  onClose: () => void;
  onOpenEditPanel?: () => void;
};

// ─── Component ────────────────────────────────────────────────────────────────
export function ScheduleBlockModal({ data, onClose, onOpenEditPanel }: Props) {
  // Close on Escape
  React.useEffect(() => {
    if (!data) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [data, onClose]);

  if (!data) return null;

  const { block, student, teacher, locationName } = data;

  const startLabel = toLabel(block.start_time);
  const endLabel   = toLabel(block.end_time);

  // Determine effective block type (mirrors getBlockDisplay logic)
  const effectiveType: string = (() => {
    if (block.checked_in) return "student_session"; // checked-in = normal session
    if (block.is_family_callout || block.block_type === "call_out") return "call_out";
    if (block.is_makeup_session || block.block_type === "makeup_session") return "makeup_session";
    if (block.is_virtual || block.block_type === "virtual") return "virtual";
    return block.block_type ?? "student_session";
  })();

  const typeLabel = block.checked_in ? "Checked In" : (BLOCK_TYPE_LABELS[effectiveType] ?? effectiveType);
  const typeColor = BLOCK_TYPE_COLORS[effectiveType] ?? { bg: "rgba(255,255,255,0.05)", text: "var(--z-muted)" };

  // Instrument from student record
  const instrument = (() => {
    if (!student) return null;
    const s = student as unknown as Record<string, unknown>;
    return typeof s.instrument === "string" && s.instrument.trim() ? s.instrument.trim() : null;
  })();

  // Is this a real student slot (not open/training/etc)?
  const hasStudent = !!student && !!block.student_id;
  const hasTeacher = !!teacher && !!block.teacher_id;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Lesson Details"
        className="fixed left-1/2 top-1/2 z-[80] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--z-border)] bg-[#0f0f12] p-0 shadow-[0_24px_64px_rgba(0,0,0,0.7)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header bar — Ziro Green left accent ── */}
        <div className="relative border-b border-[var(--z-border)] bg-gradient-to-r from-[#00ff88]/8 to-transparent px-5 py-4">
          {/* Green left border accent */}
          <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl bg-gradient-to-b from-[#00ff88] to-[#00ff88]/20" />

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {/* Time range */}
              <div className="text-xl font-black tracking-tight text-[var(--z-fg)]">
                {startLabel}
                <span className="mx-1.5 text-[var(--z-muted)] font-normal">–</span>
                {endLabel}
              </div>
              {/* Instrument + location */}
              <div className="mt-0.5 flex items-center gap-2 text-xs font-semibold text-[var(--z-muted)]">
                {instrument && (
                  <>
                    <span className="text-[var(--z-fg)]/70">{instrument}</span>
                    <span className="text-[var(--z-border)]">·</span>
                  </>
                )}
                <span>{locationName}</span>
              </div>
            </div>

            {/* Status pill + close */}
            <div className="flex shrink-0 items-center gap-2">
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest"
                style={{ background: typeColor.bg, color: typeColor.text }}
              >
                {typeLabel}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1 text-[var(--z-muted)] transition-colors hover:bg-white/8 hover:text-[var(--z-fg)]"
                aria-label="Close"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="space-y-3 px-5 py-4">

          {/* Student row */}
          <div className="flex items-center justify-between rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-3">
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--z-muted)]">Student</div>
              {hasStudent ? (
                <Link
                  href={`/students/${block.student_id}`}
                  onClick={onClose}
                  className="mt-0.5 block truncate text-sm font-bold text-[var(--z-fg)] transition-colors hover:text-[#00ff88] hover:underline underline-offset-2"
                >
                  {studentName(student)}
                </Link>
              ) : (
                <div className="mt-0.5 text-sm font-bold text-[var(--z-muted)]">
                  {typeLabel}
                </div>
              )}
            </div>
            {hasStudent && (
              <Link
                href={`/students/${block.student_id}`}
                onClick={onClose}
                className="ml-3 shrink-0 rounded-lg border border-[var(--z-border)] px-2.5 py-1 text-[10px] font-bold text-[var(--z-muted)] transition-all hover:border-[#00ff88]/40 hover:bg-[#00ff88]/8 hover:text-[#00ff88]"
              >
                View →
              </Link>
            )}
          </div>

          {/* Teacher row */}
          <div className="flex items-center justify-between rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-3">
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--z-muted)]">Teacher</div>
              {hasTeacher ? (
                <Link
                  href={`/teachers/${block.teacher_id}`}
                  onClick={onClose}
                  className="mt-0.5 block truncate text-sm font-bold text-[var(--z-fg)] transition-colors hover:text-[#00ff88] hover:underline underline-offset-2"
                >
                  {teacherName(teacher)}
                </Link>
              ) : (
                <div className="mt-0.5 text-sm font-bold text-[var(--z-muted)]">Staff</div>
              )}
            </div>
            {hasTeacher && (
              <Link
                href={`/teachers/${block.teacher_id}`}
                onClick={onClose}
                className="ml-3 shrink-0 rounded-lg border border-[var(--z-border)] px-2.5 py-1 text-[10px] font-bold text-[var(--z-muted)] transition-all hover:border-[#00ff88]/40 hover:bg-[#00ff88]/8 hover:text-[#00ff88]"
              >
                View →
              </Link>
            )}
          </div>

          {/* Extra flags row */}
          {(block.is_virtual || block.checked_in || block.notes) && (
            <div className="space-y-1.5 rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-3">
              {block.is_virtual && (
                <div className="flex items-center gap-2 text-xs text-[#38bdf8]">
                  <span>🌐</span>
                  <span className="font-semibold">Virtual Session</span>
                  {block.meet_link && (
                    <a
                      href={block.meet_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto text-[10px] font-bold underline underline-offset-2 hover:text-white"
                    >
                      Join →
                    </a>
                  )}
                </div>
              )}
              {block.checked_in && (
                <div className="flex items-center gap-2 text-xs text-[#4ade80]">
                  <span>✓</span>
                  <span className="font-semibold">Checked In</span>
                </div>
              )}
              {block.notes && (
                <div className="text-xs text-[var(--z-muted)] italic">
                  {block.notes}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t border-[var(--z-border)] px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-[var(--z-muted)] transition-colors hover:text-[var(--z-fg)]"
          >
            Close
          </button>
          {onOpenEditPanel && (
            <button
              type="button"
              onClick={() => { onOpenEditPanel(); onClose(); }}
              className="rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-1.5 text-xs font-bold text-[var(--z-fg)] transition-all hover:border-[#00ff88]/40 hover:bg-[#00ff88]/8 hover:text-[#00ff88]"
            >
              Edit Session →
            </button>
          )}
        </div>
      </div>
    </>
  );
}
