"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { ErrorBoundary, SegmentErrorView } from "@/components/system/ErrorBoundary";
export default function DashboardError({ error, reset, }) {
    return (_jsx(ErrorBoundary, { children: _jsx(SegmentErrorView, { error: error, reset: reset, title: "Dashboard could not load" }) }));
}
