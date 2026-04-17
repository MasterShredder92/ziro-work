"use client";
import { PortalErrorBoundary } from "@/components/system/PortalErrorBoundary";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <PortalErrorBoundary portal="admin" error={error} reset={reset} />;
}
