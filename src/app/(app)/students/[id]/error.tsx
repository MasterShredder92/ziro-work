"use client";

import { ErrorBoundary, SegmentErrorView } from "@/components/system/ErrorBoundary";

export default function StudentDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorBoundary>
      <SegmentErrorView error={error} reset={reset} title="Student profile could not load" />
    </ErrorBoundary>
  );
}
