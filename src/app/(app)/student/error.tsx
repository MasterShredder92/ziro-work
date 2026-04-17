"use client";
import { PortalErrorBoundary } from "@/components/system/PortalErrorBoundary";

export default function StudentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <PortalErrorBoundary portal="student" error={error} reset={reset} />;
}
