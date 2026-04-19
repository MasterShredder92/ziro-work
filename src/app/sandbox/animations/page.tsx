"use client";

import * as React from "react";
import type { Teacher } from "@/lib/data/models";
import type { Student } from "@/lib/data/models";
import { StudioMapClassic } from "@/components/studio-map/StudioMapClassic";
import { PageTransition } from "@/components/system/PageTransition";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const MOCK_TEACHER_A: Teacher = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  tenant_id: "00000000-0000-0000-0000-000000000001",
  created_at: "2026-01-01T00:00:00.000Z",
  name: "Alex Rivera",
  email: null,
  phone: null,
  status: "active",
  max_students: 20,
  weekly_capacity_minutes: null,
  notes: null,
  archived_at: null,
};

const MOCK_TEACHER_B: Teacher = {
  id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  tenant_id: "00000000-0000-0000-0000-000000000001",
  created_at: "2026-01-02T00:00:00.000Z",
  name: "Jordan Lee",
  email: null,
  phone: null,
  status: "active",
  max_students: 16,
  weekly_capacity_minutes: null,
  notes: null,
  archived_at: null,
};

const MOCK_STUDENTS: Array<Pick<Student, "id" | "name" | "status">> = [
  { id: "cccccccc-cccc-cccc-cccc-cccccccccccc", name: "Sam Chen", status: "active" },
  { id: "dddddddd-dddd-dddd-dddd-dddddddddddd", name: "Riley Park", status: "active" },
  { id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee", name: "Casey Nova", status: "paused" },
];

function OrbPhysicsDemo() {
  const [expandedTeacherId, setExpandedTeacherId] = React.useState<string | null>(MOCK_TEACHER_A.id);

  return (
    <Card padding="lg" radius="lg" variant="default" className="max-w-4xl">
      <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-[var(--z-muted)]">Orb physics</h2>
      <p className="mt-2 text-xs text-[var(--z-muted)]">
        Staggered map entry, teacher magnet hover, student float / ripple / glow (see studio map tokens).
      </p>
      <div className="mt-[var(--z-space-6)]">
        <StudioMapClassic
          studioLabel="Demo"
          teachers={[
            { teacher: MOCK_TEACHER_A, studentCount: 2 },
            { teacher: MOCK_TEACHER_B, studentCount: 0 },
          ]}
          expandedTeacherId={expandedTeacherId}
          onTeacherToggle={(id) => setExpandedTeacherId((cur) => (cur === id ? null : id))}
          studentsForExpandedTeacher={expandedTeacherId === MOCK_TEACHER_A.id ? MOCK_STUDENTS : null}
          expandedStudentsLoading={false}
        />
      </div>
    </Card>
  );
}

function PageTransitionDemo() {
  const [k, setK] = React.useState(0);
  return (
    <Card padding="lg" radius="lg" variant="default" className="max-w-4xl">
      <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-[var(--z-muted)]">Page transitions</h2>
      <p className="mt-2 text-xs text-[var(--z-muted)]">
        Fade + slide using <code className="text-[var(--z-accent-color)]">z-page-transition</code> (
        <code className="text-[var(--z-accent-color)]">--z-duration-medium</code>,{" "}
        <code className="text-[var(--z-accent-color)]">--z-ease-smooth</code>).
      </p>
      <Button type="button" className="mt-[var(--z-space-4)]" onClick={() => setK((n) => n + 1)}>
        Replay transition
      </Button>
      <div className="mt-[var(--z-space-5)] rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] p-[var(--z-space-4)]">
        <PageTransition key={k}>
          <p className="text-sm text-[var(--z-fg)]">Content block remounts with entry motion.</p>
        </PageTransition>
      </div>
    </Card>
  );
}

function NeonEffectsDemo() {
  return (
    <Card padding="lg" radius="lg" variant="default" className="max-w-4xl">
      <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-[var(--z-muted)]">Neon ramp</h2>
      <p className="mt-2 text-xs text-[var(--z-muted)]">
        Hover panels use <code className="text-[var(--z-accent-color)]">.neon-ramp</code> with{" "}
        <code className="text-[var(--z-accent-color)]">--z-accent-color</code>.
      </p>
      <div className="mt-[var(--z-space-5)] flex flex-wrap gap-[var(--z-space-4)]">
        <div className="neon-ramp rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-[var(--z-space-5)] py-[var(--z-space-4)] text-sm text-[var(--z-fg)]">
          Hover card
        </div>
        <button
          type="button"
          className="neon-ramp rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-[var(--z-space-4)] py-[var(--z-space-3)] text-sm font-semibold text-[var(--z-fg)]"
        >
          Hover control
        </button>
      </div>
    </Card>
  );
}

export default function SandboxAnimationsPage() {
  return (
    <div className="min-h-full bg-[var(--z-bg)] p-[var(--z-space-8)] text-[var(--z-fg)]">
      <div className="mx-auto max-w-5xl space-y-[var(--z-space-10)]">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--z-muted)]">Sandbox</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Animations & motion</h1>
        </header>
        <OrbPhysicsDemo />
        <PageTransitionDemo />
        <NeonEffectsDemo />
      </div>
    </div>
  );
}
