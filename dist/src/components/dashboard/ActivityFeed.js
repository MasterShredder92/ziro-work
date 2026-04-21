"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEvents } from "@/hooks/data";
import { List } from "@/components/ui/List";
import { DASHBOARD_TENANT_ID } from "./constants";
import { ActivityFeedItem } from "./ActivityFeedItem";
import { daysAgoIso } from "./dashboardFormat";
const PAGE_SIZE = 25;
const MAX_PAGES = 24;
function mergeById(prev, next) {
    const map = new Map();
    for (const e of prev)
        map.set(e.id, e);
    for (const e of next)
        map.set(e.id, e);
    return Array.from(map.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
export function ActivityFeed({ showTitle = true }) {
    var _a;
    const tenantId = DASHBOARD_TENANT_ID;
    const [page, setPage] = useState(1);
    const [merged, setMerged] = useState([]);
    const sentinelRef = useRef(null);
    const loadingMoreRef = useRef(false);
    const params = useMemo(() => ({
        tenantId,
        page: { mode: "offset", page, pageSize: PAGE_SIZE },
    }), [tenantId, page]);
    const { data, isLoading, error } = useEvents(params);
    useEffect(() => {
        if (!data)
            return;
        queueMicrotask(() => {
            if (data.items.length) {
                setMerged((prev) => mergeById(prev, data.items));
            }
            loadingMoreRef.current = false;
        });
    }, [data]);
    const hasMore = ((_a = data === null || data === void 0 ? void 0 : data.items.length) !== null && _a !== void 0 ? _a : 0) === PAGE_SIZE && page < MAX_PAGES;
    const onLoadMore = useCallback(() => {
        if (!hasMore || isLoading || loadingMoreRef.current || page >= MAX_PAGES)
            return;
        loadingMoreRef.current = true;
        setPage((p) => p + 1);
    }, [hasMore, isLoading, page]);
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el)
            return;
        const obs = new IntersectionObserver((entries) => {
            const hit = entries.some((e) => e.isIntersecting);
            if (hit)
                onLoadMore();
        }, { root: null, rootMargin: "120px", threshold: 0 });
        obs.observe(el);
        return () => obs.disconnect();
    }, [onLoadMore, merged.length]);
    const weekCut = daysAgoIso(7);
    const recentFirst = useMemo(() => {
        const recent = merged.filter((e) => new Date(e.created_at).toISOString() >= weekCut);
        const older = merged.filter((e) => new Date(e.created_at).toISOString() < weekCut);
        return { recent, older };
    }, [merged, weekCut]);
    const listItems = useMemo(() => {
        const ordered = [...recentFirst.recent, ...recentFirst.older];
        return ordered.map((event) => ({
            id: event.id,
            title: _jsx(ActivityFeedItem, { event: event }),
        }));
    }, [recentFirst]);
    return (_jsxs("section", { className: showTitle ? "space-y-[var(--z-space-4)]" : "space-y-3", children: [showTitle ? (_jsxs("div", { className: "flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between", children: [_jsx("h2", { className: "text-sm font-extrabold uppercase tracking-[0.12em] text-[var(--z-muted)]", children: "Activity" }), _jsx("p", { className: "text-xs text-[var(--z-muted)]", children: "Last 7 days highlighted \u00B7 scroll for older" })] })) : null, error ? (_jsx("p", { className: "text-sm text-[var(--z-danger)]", children: error.message })) : listItems.length === 0 && !isLoading ? (_jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "No events yet." })) : (_jsxs(_Fragment, { children: [_jsx(List, { items: listItems }), _jsx("div", { ref: sentinelRef, className: "h-6 w-full", "aria-hidden": true }), isLoading ? (_jsx("p", { className: "text-center text-xs text-[var(--z-muted)]", children: "Loading\u2026" })) : null] }))] }));
}
