"use client";
import dynamic from "next/dynamic";
import type { Schedule } from "@/lib/scheduling/types";

const SchedulingShell = dynamic(
  () => import("./SchedulingShell").then((m) => ({ default: m.SchedulingShell })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center text-[var(--z-muted)] text-sm">
        Loading schedule…
      </div>
    ),
  }
);

export function SchedulingShellWrapper({ initialSchedules }: { initialSchedules: Schedule[] }) {
  return <SchedulingShell initialSchedules={initialSchedules} />;
}
