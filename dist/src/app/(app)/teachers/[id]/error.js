"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { ErrorBoundary, SegmentErrorView } from "@/components/system/ErrorBoundary";
export default function TeacherDetailError({ error, reset, }) {
    return (_jsx(ErrorBoundary, { children: _jsx(SegmentErrorView, { error: error, reset: reset, title: "Teacher profile could not load" }) }));
}
