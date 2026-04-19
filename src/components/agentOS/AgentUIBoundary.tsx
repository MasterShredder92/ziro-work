"use client";

import React from "react";

type AgentUIBoundaryProps = {
  children: React.ReactNode;
};

type AgentUIBoundaryState = {
  hasError: boolean;
};

export class AgentUIBoundary extends React.Component<
  AgentUIBoundaryProps,
  AgentUIBoundaryState
> {
  state: AgentUIBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AgentUIBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    console.error("[agentOS.ui_boundary]", error);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="sr-only" role="status" aria-live="polite">
          Assistant tools are temporarily unavailable.
        </div>
      );
    }
    return this.props.children;
  }
}
