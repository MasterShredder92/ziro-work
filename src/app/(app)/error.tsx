"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AppErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[app.error_boundary]", {
      name: error.name,
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full">
        <div className="text-xs uppercase tracking-wider text-[#606068] mb-2">
          Something went wrong
        </div>
        <h1 className="text-2xl font-extrabold text-[#f0f0f0] mb-3">
          We hit an unexpected error
        </h1>
        <p className="text-sm text-[#8a8a92] mb-6">
          The team has been notified. You can retry the action or head back to
          your dashboard.
        </p>
        {error.digest ? (
          <div className="text-[11px] text-[#50525a] mb-6 font-mono">
            ref: {error.digest}
          </div>
        ) : null}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-[#00ff88] text-black text-sm font-semibold"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 rounded-lg border border-[#2a2a30] text-sm text-[#d4d4d4]"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
