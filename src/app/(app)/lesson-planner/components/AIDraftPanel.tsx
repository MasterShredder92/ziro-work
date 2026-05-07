"use client";

import { useState } from "react";
import type { LessonPlan } from "@/lib/lessonPlanner/types";

type AIDraftPanelProps = {
  tenantId: string;
  plan?: LessonPlan | null;
  canWrite: boolean;
};

type DraftFormState = {
  title: string;
  subject: string;
  gradeLevel: string;
  durationMinutes: number;
  standards: string;
  focusAreas: string;
  prompt: string;
};

export function AIDraftPanel({ tenantId, plan, canWrite }: AIDraftPanelProps) {
  const [form, setForm] = useState<DraftFormState>({
    title: plan?.title ?? "",
    subject: plan?.subject ?? "",
    gradeLevel: plan?.grade_level ?? "",
    durationMinutes: plan?.duration_minutes ?? 45,
    standards: plan?.standards?.join(", ") ?? "",
    focusAreas: "",
    prompt: "",
  });
  const [busy, setBusy] = useState<"draft" | "save" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  type Draft = Parameters<typeof renderDraft>[0];
  const [draft, setDraft] = useState<Draft | null>(null);

  function update<K extends keyof DraftFormState>(
    key: K,
    value: DraftFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function runDraft() {
    setBusy("draft");
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/lesson-planner/api/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          request: {
            tenantId,
            planId: plan?.id ?? null,
            title: form.title || undefined,
            subject: form.subject || undefined,
            gradeLevel: form.gradeLevel || undefined,
            durationMinutes: form.durationMinutes || undefined,
            standards: parseCSV(form.standards),
            focusAreas: parseCSV(form.focusAreas),
            prompt: form.prompt || undefined,
          },
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Draft failed (${res.status})`);
      }
      const body = (await res.json()) as { data: { draft: Draft } };
      setDraft(body.data.draft);
      setMessage("Draft ready — review and save to create a version.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Draft failed");
    } finally {
      setBusy(null);
    }
  }

  async function saveDraft() {
    if (!draft) return;
    setBusy("save");
    setError(null);
    try {
      const res = await fetch("/lesson-planner/api/version", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          planId: plan?.id ?? null,
          draft,
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Save failed (${res.status})`);
      }
      setMessage("Saved. Reload the page to see the updated version.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
            Ziro AI
          </div>
          <h3 className="text-sm font-semibold text-[var(--z-fg)]">
            Draft a lesson plan with AI
          </h3>
          <p className="mt-1 text-xs text-[var(--z-muted)]">
            Generate objectives, activities, and materials aligned to your
            standards. Review and save to create a new version.
          </p>
        </div>
        <span className="rounded-full border border-[var(--z-border)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Beta
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Title">
          <input
            type="text"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g. Intro to rhythm"
            className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)] focus:outline-none focus:border-[#c4f036]/50"
          />
        </Field>
        <Field label="Subject">
          <input
            type="text"
            value={form.subject}
            onChange={(e) => update("subject", e.target.value)}
            placeholder="e.g. Music theory"
            className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)] focus:outline-none focus:border-[#c4f036]/50"
          />
        </Field>
        <Field label="Grade level">
          <input
            type="text"
            value={form.gradeLevel}
            onChange={(e) => update("gradeLevel", e.target.value)}
            placeholder="e.g. Beginner"
            className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)] focus:outline-none focus:border-[#c4f036]/50"
          />
        </Field>
        <Field label="Duration (min)">
          <input
            type="number"
            min={5}
            max={240}
            value={form.durationMinutes}
            onChange={(e) =>
              update("durationMinutes", Number(e.target.value) || 0)
            }
            className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)] focus:outline-none focus:border-[#c4f036]/50"
          />
        </Field>
        <Field label="Standards (comma separated)" wide>
          <input
            type="text"
            value={form.standards}
            onChange={(e) => update("standards", e.target.value)}
            placeholder="MU:Pr4.1, MU:Re7.2"
            className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)] focus:outline-none focus:border-[#c4f036]/50"
          />
        </Field>
        <Field label="Focus areas (comma separated)" wide>
          <input
            type="text"
            value={form.focusAreas}
            onChange={(e) => update("focusAreas", e.target.value)}
            placeholder="listening, improvisation"
            className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)] focus:outline-none focus:border-[#c4f036]/50"
          />
        </Field>
        <Field label="Prompt (optional)" wide>
          <textarea
            value={form.prompt}
            onChange={(e) => update("prompt", e.target.value)}
            rows={3}
            placeholder="Anything specific you want the draft to cover?"
            className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)] focus:outline-none focus:border-[#c4f036]/50"
          />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!canWrite || busy !== null}
          onClick={runDraft}
          className="rounded-md border border-[#c4f036]/40 bg-[#c4f036]/10 px-3 py-1.5 text-xs font-semibold text-[#c4f036] hover:bg-[#c4f036]/20 disabled:opacity-50"
        >
          {busy === "draft" ? "Drafting…" : "Generate draft"}
        </button>
        <button
          type="button"
          disabled={!canWrite || !draft || busy !== null}
          onClick={saveDraft}
          className="rounded-md border border-[var(--z-border)] px-3 py-1.5 text-xs font-semibold text-[var(--z-fg)] hover:border-[#c4f036]/40 hover:text-[#c4f036] disabled:opacity-50"
        >
          {busy === "save" ? "Saving…" : "Save as new version"}
        </button>
        {message ? (
          <span className="text-xs text-[#c4f036]">{message}</span>
        ) : null}
        {error ? (
          <span className="text-xs text-[var(--z-danger)]">{error}</span>
        ) : null}
      </div>

      {draft ? <div className="mt-2">{renderDraft(draft)}</div> : null}
    </div>
  );
}

function Field({
  label,
  children,
  wide,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={wide ? "md:col-span-2 block" : "block"}>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function parseCSV(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

type AIDraftRendered = {
  title: string;
  summary: string;
  objectives: Array<{ text: string; bloom_level?: string | null }>;
  activities: Array<{
    title: string;
    description?: string | null;
    kind?: string | null;
    duration_minutes?: number | null;
  }>;
  materials: Array<{ title: string; kind?: string | null }>;
  curriculumAlignment: string[];
  estimatedDurationMinutes: number;
};

function renderDraft(draft: AIDraftRendered) {
  return (
    <div className="rounded-md border border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),black_6%)] p-3 space-y-3 text-xs">
      <div>
        <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
          Proposed title
        </div>
        <div className="text-sm font-semibold text-[var(--z-fg)]">
          {draft.title}
        </div>
        <p className="mt-1 text-[var(--z-muted)]">{draft.summary}</p>
      </div>

      <section>
        <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
          Objectives
        </div>
        <ol className="mt-1 list-decimal space-y-1 pl-4 text-[var(--z-fg)]">
          {draft.objectives.map((o, i) => (
            <li key={i}>
              {o.text}
              {o.bloom_level ? (
                <span className="ml-2 rounded-full border border-[var(--z-border)] px-1.5 py-0.5 text-[10px] uppercase text-[var(--z-muted)]">
                  {o.bloom_level}
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      <section>
        <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
          Activities ({draft.estimatedDurationMinutes} min total)
        </div>
        <ol className="mt-1 list-decimal space-y-1 pl-4 text-[var(--z-fg)]">
          {draft.activities.map((a, i) => (
            <li key={i}>
              <span className="font-semibold">{a.title}</span>
              {a.duration_minutes ? ` · ${a.duration_minutes} min` : ""}
              {a.kind ? ` · ${a.kind.replace(/_/g, " ")}` : ""}
              {a.description ? (
                <div className="text-[var(--z-muted)]">{a.description}</div>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      <section>
        <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
          Materials
        </div>
        <ul className="mt-1 list-disc space-y-1 pl-4 text-[var(--z-fg)]">
          {draft.materials.map((m, i) => (
            <li key={i}>
              {m.title}
              {m.kind ? ` · ${m.kind}` : ""}
            </li>
          ))}
        </ul>
      </section>

      {draft.curriculumAlignment.length > 0 ? (
        <section>
          <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
            Curriculum alignment
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {draft.curriculumAlignment.map((c) => (
              <span
                key={c}
                className="rounded-full border border-[var(--z-border)] px-2 py-0.5 text-[10px] text-[var(--z-muted)]"
              >
                {c}
              </span>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
