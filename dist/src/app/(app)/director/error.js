"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { PortalErrorBoundary } from "@/components/system/PortalErrorBoundary";
export default function DirectorError({ error, reset, }) {
    return _jsx(PortalErrorBoundary, { portal: "director", error: error, reset: reset });
}
