"use client";

import { ErrorBoundary, SegmentErrorView } from "@/components/system/ErrorBoundary";

export default function TeacherDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorBoundary>
      <SegmentErrorView error={error} reset={reset} title="Teacher profile could not load" />
    </ErrorBoundary>
  );
}
