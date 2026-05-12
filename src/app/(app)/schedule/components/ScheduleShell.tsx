"use client";

import type { ReactNode } from "react";

/** Full-bleed schedule surface — module chrome lives in TopBar + MultiLocationScheduleClient. */
export function ScheduleShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <section className="min-h-0 flex-1 overflow-hidden">{children}</section>
    </div>
  );
}
