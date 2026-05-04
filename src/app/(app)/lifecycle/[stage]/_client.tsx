"use client";

import { useEffect, useMemo, useState } from "react";
import type { LifecycleStageId } from "@/lib/lifecycle/types";
import { StageHeader } from "@/components/stages/StageHeader";
import { StageStudentList } from "@/components/stages/StageStudentList";
import { loadLifecycleStageSurface, type LifecycleStageSurfaceDTO } from "./actions";
import { PageTransition } from "@/components/system/PageTransition";

function isRetryableError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("timeout") ||
    normalized.includes("temporar") ||
    normalized.includes("network") ||
    normalized.includes("fetch") ||
    normalized.includes("failed to load stage")
  );
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function StageSurfaceLoaded({
  stageId,
  tenantId,
  locationId,
}: {
  stageId: LifecycleStageId;
  tenantId: string;
  locationId: string | null;
}) {
  const [data, setData] = useState<LifecycleStageSurfaceDTO | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const maxAttempts = 3;
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const res = await loadLifecycleStageSurface(stageId, tenantId, locationId);
        if (cancelled) return;
        if (res.ok) {
          setErr(null);
          setData(res.data);
          setLoading(false);
          return;
        }
        if (attempt < maxAttempts && isRetryableError(res.error)) {
          await wait(attempt * 500);
          continue;
        }
        setErr(res.error);
        setData(null);
        setLoading(false);
        return;
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [locationId, stageId, tenantId]);

  const nextActions = useMemo(() => {
    if (!data) return [];
    return [
      `Work the list for ${data.stageName}.`,
      'If something is marked "Needs attention", fix it first — then move forward.',
    ];
  }, [data]);

  return (
    <PageTransition>
      <div className="mx-auto w-full space-y-[var(--z-space-8)]">
        {loading ? <div className="text-sm text-[var(--z-muted)]">Loading…</div> : null}
        {err ? <div className="text-sm text-[var(--z-danger)]">{err}</div> : null}
        {data?.warnings?.length ? (
          <div className="rounded-xl border border-[var(--z-warning)]/40 bg-[var(--z-warning)]/10 p-3 text-xs text-[var(--z-warning)]">
            {data.warnings[0]?.message}
          </div>
        ) : null}
        {data ? (
          <>
            <StageHeader
              stageName={data.stageName}
              description={data.stageDescription}
            />
            <div className="rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] px-[var(--z-space-5)] py-[var(--z-space-4)] space-y-[var(--z-space-3)]">
              <p className="text-sm leading-relaxed text-[color-mix(in_oklab,var(--z-fg),transparent_22%)]">
                {data.stageSummary}
              </p>
              {nextActions.length > 0 ? (
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]">
                    Next steps
                  </div>
                  <ol className="list-decimal space-y-1 pl-5 text-sm text-[color-mix(in_oklab,var(--z-fg),transparent_10%)]">
                    {nextActions.map((a, i) => (
                      <li key={`${a}-${i}`}>{a}</li>
                    ))}
                  </ol>
                </div>
              ) : null}
            </div>
            <StageStudentList students={data.students} />
          </>
        ) : null}
      </div>
    </PageTransition>
  );
}

export function StageSurfaceClient({
  stageId,
  tenantId,
  locationId,
}: {
  stageId: LifecycleStageId;
  tenantId: string;
  locationId: string | null;
}) {
  return (
    <StageSurfaceLoaded
      key={`${stageId}-${tenantId}-${locationId ?? "all"}`}
      stageId={stageId}
      tenantId={tenantId}
      locationId={locationId}
    />
  );
}
