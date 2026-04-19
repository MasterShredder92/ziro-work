"use client";

import * as React from "react";
import { cn } from "@/components/ui/utils";

function RouteSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-[var(--z-space-4)] p-[var(--z-space-6)]">
      <div className="h-8 w-48 max-w-[60%] animate-pulse rounded-[var(--z-radius-sm)] bg-[var(--z-surface-2)]" />
      <div className="grid flex-1 grid-cols-1 gap-[var(--z-space-3)] lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "min-h-[120px] animate-pulse rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)]",
              i === 0 && "lg:col-span-2 min-h-[180px]",
            )}
          />
        ))}
      </div>
    </div>
  );
}

export type RouteLoadingBoundaryProps = {
  children: React.ReactNode;
};

export function RouteLoadingBoundary({ children }: RouteLoadingBoundaryProps) {
  return <React.Suspense fallback={<RouteSkeleton />}>{children}</React.Suspense>;
}
