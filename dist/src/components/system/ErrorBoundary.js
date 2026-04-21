"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn, focusRingClassName } from "@/components/ui/utils";
export class ErrorBoundary extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { hasError: false, error: null };
        this.handleReset = () => {
            this.setState({ hasError: false, error: null });
        };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    render() {
        if (this.state.hasError && this.state.error) {
            return (_jsx("div", { className: "flex h-full min-h-0 items-center justify-center p-[var(--z-space-6)]", children: _jsxs(Card, { padding: "lg", radius: "md", variant: "default", className: "max-w-md border-[var(--z-border)]", children: [_jsx("h2", { className: "text-base font-extrabold text-[var(--z-fg)]", children: "Something broke" }), _jsx("p", { className: "mt-[var(--z-space-3)] text-sm leading-relaxed text-[var(--z-muted)]", children: this.state.error.message || "An unexpected error occurred while rendering this view." }), _jsx(Button, { type: "button", className: cn("mt-[var(--z-space-5)]", focusRingClassName()), onClick: this.handleReset, children: "Try again" })] }) }));
        }
        return this.props.children;
    }
}
export function SegmentErrorView({ error, reset, title }) {
    return (_jsx("div", { className: "flex min-h-[50vh] items-center justify-center p-[var(--z-space-6)]", children: _jsxs(Card, { padding: "lg", radius: "md", variant: "default", className: "max-w-lg border-[color-mix(in_oklab,var(--z-accent),transparent_78%)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent),transparent_88%)]", children: [_jsx("h2", { className: "text-base font-extrabold text-[var(--z-fg)]", children: title !== null && title !== void 0 ? title : "This page hit an error" }), _jsx("p", { className: "mt-[var(--z-space-3)] text-sm leading-relaxed text-[var(--z-muted)]", children: error.message || "Something went wrong. You can retry or return to a stable screen." }), _jsx(Button, { type: "button", variant: "primary", className: cn("mt-[var(--z-space-5)]", focusRingClassName()), onClick: () => reset(), children: "Retry" })] }) }));
}
