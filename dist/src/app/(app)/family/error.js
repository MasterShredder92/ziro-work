"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { PortalErrorBoundary } from "@/components/system/PortalErrorBoundary";
export default function FamilyError({ error, reset, }) {
    return _jsx(PortalErrorBoundary, { portal: "family", error: error, reset: reset });
}
