"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { MESSAGING_TOAST_EVENT } from "./messagingToast";
export function MessagingToastHost() {
    const [toasts, setToasts] = useState([]);
    useEffect(() => {
        let id = 0;
        const onToast = (e) => {
            const ce = e;
            const tid = ++id;
            setToasts((prev) => [
                ...prev,
                { id: tid, message: ce.detail.message, kind: ce.detail.kind },
            ]);
            window.setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== tid));
            }, 4200);
        };
        window.addEventListener(MESSAGING_TOAST_EVENT, onToast);
        return () => window.removeEventListener(MESSAGING_TOAST_EVENT, onToast);
    }, []);
    if (toasts.length === 0)
        return null;
    return (_jsx("div", { className: "pointer-events-none fixed bottom-4 right-4 z-[100] flex max-w-sm flex-col gap-2", "aria-live": "polite", children: toasts.map((t) => (_jsx("div", { className: `pointer-events-auto rounded-md border px-3 py-2 text-xs shadow-lg ${t.kind === "success"
                ? "border-emerald-500/40 bg-emerald-950/90 text-emerald-100"
                : "border-red-500/50 bg-red-950/90 text-red-100"}`, children: t.message }, t.id))) }));
}
