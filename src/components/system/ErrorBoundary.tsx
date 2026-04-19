"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn, focusRingClassName } from "@/components/ui/utils";

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export type ErrorBoundaryProps = {
  children: React.ReactNode;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="flex h-full min-h-0 items-center justify-center p-[var(--z-space-6)]">
          <Card padding="lg" radius="md" variant="default" className="max-w-md border-[var(--z-border)]">
            <h2 className="text-base font-extrabold text-[var(--z-fg)]">Something broke</h2>
            <p className="mt-[var(--z-space-3)] text-sm leading-relaxed text-[var(--z-muted)]">
              {this.state.error.message || "An unexpected error occurred while rendering this view."}
            </p>
            <Button
              type="button"
              className={cn("mt-[var(--z-space-5)]", focusRingClassName())}
              onClick={this.handleReset}
            >
              Try again
            </Button>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}

export type SegmentErrorViewProps = {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
};

export function SegmentErrorView({ error, reset, title }: SegmentErrorViewProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-[var(--z-space-6)]">
      <Card
        padding="lg"
        radius="md"
        variant="default"
        className="max-w-lg border-[color-mix(in_oklab,var(--z-accent),transparent_78%)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent),transparent_88%)]"
      >
        <h2 className="text-base font-extrabold text-[var(--z-fg)]">{title ?? "This page hit an error"}</h2>
        <p className="mt-[var(--z-space-3)] text-sm leading-relaxed text-[var(--z-muted)]">
          {error.message || "Something went wrong. You can retry or return to a stable screen."}
        </p>
        <Button
          type="button"
          variant="primary"
          className={cn("mt-[var(--z-space-5)]", focusRingClassName())}
          onClick={() => reset()}
        >
          Retry
        </Button>
      </Card>
    </div>
  );
}
