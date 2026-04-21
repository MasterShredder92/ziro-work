"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { PortalErrorBoundary } from "@/components/system/PortalErrorBoundary";
export default function AdminError({ error, reset, }) {
    return _jsx(PortalErrorBoundary, { portal: "admin", error: error, reset: reset });
}
