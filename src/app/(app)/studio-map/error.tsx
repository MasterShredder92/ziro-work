"use client";

import { ErrorBoundary, SegmentErrorView } from "@/components/system/ErrorBoundary";

export default function StudioMapError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorBoundary>
      <SegmentErrorView error={error} reset={reset} title="Studio map could not load" />
    </ErrorBoundary>
  );
}
