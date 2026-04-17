"use client";
import { PortalErrorBoundary } from "@/components/system/PortalErrorBoundary";

export default function TeacherError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <PortalErrorBoundary portal="teacher" error={error} reset={reset} />;
}
