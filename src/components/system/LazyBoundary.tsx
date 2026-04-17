"use client";

import { Suspense, type ReactNode } from "react";

export interface LazyBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  label?: string;
}

function DefaultFallback({ label }: { label?: string }) {
  return (
    <div
      className="flex items-center justify-center py-12 text-xs text-[#707078]"
      aria-live="polite"
      aria-busy="true"
    >
      {label ? `Loading ${label}…` : "Loading…"}
    </div>
  );
}

/**
 * Wrap lazy-loaded heavy routes (reports, content library, files) so the
 * code-split chunk has a consistent fallback and we get a place to surface
 * slow-loads in the future.
 */
export function LazyBoundary({ children, fallback, label }: LazyBoundaryProps) {
  return <Suspense fallback={fallback ?? <DefaultFallback label={label} />}>{children}</Suspense>;
}
