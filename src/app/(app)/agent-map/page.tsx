import { EmptyState } from "@/components/system/SurfaceStates";
import { resolveScheduleContext } from "../schedule/guard";
import { PageShell } from "@/components/layouts/PageShell";
import { PageTransition } from "@/components/system/PageTransition";
import dynamic from "next/dynamic";

const AgentPipelineCanvas = dynamic(
  () => import("@/components/studio-map/AgentPipelineCanvas").then((m) => ({ default: m.AgentPipelineCanvas })),
  { loading: () => <div className="h-[600px] w-full animate-pulse bg-white/5 rounded-3xl" /> },
);

export default async function AgentMapPage() {
  let ctx;
  try {
    ctx = await resolveScheduleContext();
  } catch {
    return (
      <EmptyState
        title="Forbidden"
        description="You do not have permission to view Agent Map."
      />
    );
  }

  return (
    <PageShell
      title="Agent Map"
      showBreadcrumb={true}
      shellClassName="min-h-full bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,color-mix(in_oklab,var(--z-accent),transparent_94%),transparent_52%)] p-3 pt-2 sm:p-6 sm:pt-5"
      mainClassName="mt-0"
    >
      <PageTransition>
        <div className="mx-auto max-w-[1600px] flex flex-col gap-4 sm:gap-8">
          {/* ── Agent Pipeline Canvas ─────────────────────────────────── */}
          <div className="h-[600px] w-full rounded-3xl border border-[var(--z-border)] bg-[var(--z-surface-2)]/50 overflow-hidden">
            <AgentPipelineCanvas />
          </div>
        </div>
      </PageTransition>
    </PageShell>
  );
}
