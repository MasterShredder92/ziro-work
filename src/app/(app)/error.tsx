"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function AppErrorBoundary({
  error,
  unstable_retry,
  reset,
}: {
  error: Error & { digest?: string };
  unstable_retry?: () => void;
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app.error_boundary]", {
      name: error.name,
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-16">
      <Card className="max-w-md w-full" padding="lg">
        <div className="mb-2 text-xs uppercase tracking-wider text-[var(--z-muted)]">
          Something went wrong
        </div>
        <h1 className="mb-3 text-2xl font-extrabold text-[var(--z-fg)]">
          We hit an unexpected error
        </h1>
        <p className="mb-6 text-sm text-[var(--z-muted)]">
          The team has been notified. You can retry the action or head back to
          your dashboard.
        </p>
        {error.digest ? (
          <div className="mb-6 text-[11px] font-mono text-[var(--z-muted)]">
            ref: {error.digest}
          </div>
        ) : null}
        <div className="flex gap-3" role="alert" aria-live="polite">
          <Button type="button" onClick={() => (unstable_retry ? unstable_retry() : reset())}>
            Try again
          </Button>
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-lg border border-[var(--z-border)] px-4 py-2 text-sm text-[var(--z-fg)] outline-none transition hover:bg-white/[0.04]"
          >
            Go to Dashboard
          </Link>
        </div>
      </Card>
    </div>
  );
}
