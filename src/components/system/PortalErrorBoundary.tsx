"use client";

import { useEffect } from "react";
import Link from "next/link";

export interface PortalErrorBoundaryProps {
  portal: "admin" | "director" | "teacher" | "family" | "student";
  error: Error & { digest?: string };
  reset: () => void;
}

const PORTAL_COPY: Record<PortalErrorBoundaryProps["portal"], { headline: string; home: string }> = {
  admin: { headline: "Something broke in the admin console", home: "/admin" },
  director: { headline: "Something broke in the director portal", home: "/director" },
  teacher: { headline: "Something broke in the teacher portal", home: "/teacher" },
  family: { headline: "Something broke in the family portal", home: "/family" },
  student: { headline: "Something broke in the student portal", home: "/student" },
};

export function PortalErrorBoundary({ portal, error, reset }: PortalErrorBoundaryProps) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(`[${portal}.error_boundary]`, {
      name: error.name,
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [portal, error]);

  const copy = PORTAL_COPY[portal];

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full">
        <div className="text-xs uppercase tracking-wider text-[#606068] mb-2">
          Error · {portal} portal
        </div>
        <h1 className="text-2xl font-extrabold text-[#f0f0f0] mb-3">
          {copy.headline}
        </h1>
        <p className="text-sm text-[#8a8a92] mb-6">
          We logged the error. You can retry or return to the portal home.
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
            href={copy.home}
            className="inline-flex items-center px-4 py-2 rounded-lg border border-[#2a2a30] text-sm text-[#d4d4d4]"
          >
            Portal home
          </Link>
        </div>
      </div>
    </div>
  );
}
