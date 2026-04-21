"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { PortalErrorBoundary } from "@/components/system/PortalErrorBoundary";
export default function StudentError({ error, reset, }) {
    return _jsx(PortalErrorBoundary, { portal: "student", error: error, reset: reset });
}
