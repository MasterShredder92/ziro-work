"use client";
import { PortalErrorBoundary } from "@/components/system/PortalErrorBoundary";

export default function FamilyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <PortalErrorBoundary portal="family" error={error} reset={reset} />;
}
