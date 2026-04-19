"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

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
      <Card className="max-w-md w-full" padding="lg">
        <div className="text-xs uppercase tracking-wider text-[var(--z-muted)] mb-2">
          Error · {portal} portal
        </div>
        <h1 className="text-2xl font-extrabold text-[var(--z-fg)] mb-3">
          {copy.headline}
        </h1>
        <p className="text-sm text-[var(--z-muted)] mb-6">
          We logged the error. You can retry or return to the portal home.
        </p>
        {error.digest ? (
          <div className="text-[11px] text-[var(--z-muted)] mb-6 font-mono">
            ref: {error.digest}
          </div>
        ) : null}
        <div className="flex gap-3">
          <Button type="button" onClick={() => reset()}>
            Try again
          </Button>
          <Link
            href={copy.home}
            className="inline-flex items-center px-4 py-2 rounded-lg border border-[var(--z-border)] text-sm text-[var(--z-fg)] hover:bg-white/[0.04]"
          >
            Portal home
          </Link>
        </div>
      </Card>
    </div>
  );
}
