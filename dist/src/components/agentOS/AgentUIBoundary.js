"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
export class AgentUIBoundary extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(error) {
        console.error("[agentOS.ui_boundary]", error);
    }
    render() {
        if (this.state.hasError) {
            return (_jsx("div", { className: "sr-only", role: "status", "aria-live": "polite", children: "Assistant tools are temporarily unavailable." }));
        }
        return this.props.children;
    }
}
