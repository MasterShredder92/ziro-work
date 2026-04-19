"use client";

import * as React from "react";
import { isZiroDemoMode } from "@/lib/demo/isDemoMode";

export function DemoBanner() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    setVisible(isZiroDemoMode());
  }, []);

  if (!visible) return null;

  return (
    <div className="shrink-0 border-b border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] bg-[color-mix(in_oklab,var(--z-accent),transparent_92%)] px-[var(--z-space-4)] py-[var(--z-space-2)] text-center text-xs font-semibold text-black sm:text-sm">
      You are exploring ZiroWork Demo Mode — sample teachers, students, invoices, and events are loaded
      locally.
    </div>
  );
}
