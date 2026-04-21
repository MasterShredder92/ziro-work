"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from "react";
/**
 * Tiny client component that polls `/api/messages/unread` and renders a badge
 * with the total unread count for the current user. Safe to mount anywhere in
 * the global nav.
 */
export function MessagesBadge({ className, pollMs = 60000, }) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let cancelled = false;
        const fetchCount = async () => {
            var _a, _b;
            try {
                const res = await fetch("/api/messages/unread", {
                    cache: "no-store",
                });
                if (!res.ok)
                    return;
                const payload = (await res.json());
                if (cancelled)
                    return;
                const next = (_b = (_a = payload.data) === null || _a === void 0 ? void 0 : _a.totalUnread) !== null && _b !== void 0 ? _b : 0;
                setCount(next);
            }
            catch (_c) {
                /* noop */
            }
        };
        void fetchCount();
        const interval = window.setInterval(fetchCount, pollMs);
        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, [pollMs]);
    if (count <= 0)
        return null;
    return (_jsx("span", { className: className !== null && className !== void 0 ? className : "ml-auto inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--z-accent)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--z-on-accent,white)]", children: count > 99 ? "99+" : count }));
}
