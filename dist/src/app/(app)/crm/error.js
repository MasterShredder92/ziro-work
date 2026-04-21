"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from "react";
import { PageErrorState } from "./_components";
export default function CRMError({ error, reset, }) {
    useEffect(() => {
        console.error(error);
    }, [error]);
    return (_jsx(PageErrorState, { title: "CRM couldn\u2019t load", message: error.message || "Something went wrong loading this page.", onRetry: reset }));
}
