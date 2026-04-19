"use client";

import { ErrorBoundary, SegmentErrorView } from "@/components/system/ErrorBoundary";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorBoundary>
      <SegmentErrorView error={error} reset={reset} title="Dashboard could not load" />
    </ErrorBoundary>
  );
}
