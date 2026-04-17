"use client";
import { PortalErrorBoundary } from "@/components/system/PortalErrorBoundary";

export default function DirectorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <PortalErrorBoundary portal="director" error={error} reset={reset} />;
}
