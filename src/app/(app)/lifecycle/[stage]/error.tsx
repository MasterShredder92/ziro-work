"use client";

import { ErrorBoundary, SegmentErrorView } from "@/components/system/ErrorBoundary";

export default function LifecycleStageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorBoundary>
      <SegmentErrorView error={error} reset={reset} title="Lifecycle stage could not load" />
    </ErrorBoundary>
  );
}
