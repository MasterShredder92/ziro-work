"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { PortalErrorBoundary } from "@/components/system/PortalErrorBoundary";
export default function TeacherError({ error, reset, }) {
    return _jsx(PortalErrorBoundary, { portal: "teacher", error: error, reset: reset });
}
