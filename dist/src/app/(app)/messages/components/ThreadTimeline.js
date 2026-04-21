"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useCallback, useLayoutEffect, useRef, useState, } from "react";
import { formatDayTimelineTitle, formatMessageTimelineTitle, messageDotTailwindClass, } from "./deriveThreadTimeline";
function rowCenterY(row, contentRoot) {
    let y = 0;
    let n = row;
    while (n && n !== contentRoot) {
        y += n.offsetTop;
        n = n.offsetParent;
    }
    if (n !== contentRoot) {
        const cr = contentRoot.getBoundingClientRect();
        const rr = row.getBoundingClientRect();
        return rr.top - cr.top + rr.height / 2;
    }
    return y + row.offsetHeight / 2;
}
function headerCenterY(header, contentRoot) {
    return rowCenterY(header, contentRoot);
}
function approxEqualMap(a, b) {
    var _a, _b;
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) {
        if (Math.abs(((_a = a[k]) !== null && _a !== void 0 ? _a : -1e9) - ((_b = b[k]) !== null && _b !== void 0 ? _b : -1e9)) > 0.75)
            return false;
    }
    return true;
}
export function ThreadTimeline({ scrollRootRef, contentRootRef, orderedMessageIds, dayKeysInOrder, getMessageRowEl, getDayHeaderEl, messageById, milestoneByMessageId, dayBuckets, currentProfileId, searchLayoutKey, pulseEvents = [], }) {
    const [layout, setLayout] = useState({ lineHeight: 0, messageCenters: {}, dayCenters: {} });
    const rafScroll = useRef(null);
    const dotRefMap = useRef(new Map());
    const seenPulseCount = useRef(0);
    const measure = useCallback(() => {
        const content = contentRootRef.current;
        const scrollRoot = scrollRootRef.current;
        if (!content || !scrollRoot)
            return;
        const lineHeight = content.scrollHeight;
        const messageCenters = {};
        for (const id of orderedMessageIds) {
            const el = getMessageRowEl(id);
            if (!el)
                continue;
            messageCenters[id] = rowCenterY(el, content);
        }
        const dayCenters = {};
        for (const key of dayKeysInOrder) {
            const el = getDayHeaderEl(key);
            if (!el)
                continue;
            dayCenters[key] = headerCenterY(el, content);
        }
        setLayout((prev) => {
            if (prev.lineHeight === lineHeight &&
                approxEqualMap(prev.messageCenters, messageCenters) &&
                approxEqualMap(prev.dayCenters, dayCenters)) {
                return prev;
            }
            return { lineHeight, messageCenters, dayCenters };
        });
    }, [
        contentRootRef,
        scrollRootRef,
        orderedMessageIds,
        dayKeysInOrder,
        getMessageRowEl,
        getDayHeaderEl,
    ]);
    useLayoutEffect(() => {
        measure();
    }, [measure, searchLayoutKey]);
    useLayoutEffect(() => {
        const scrollRoot = scrollRootRef.current;
        const content = contentRootRef.current;
        if (!scrollRoot || !content)
            return;
        const ro = new ResizeObserver(() => measure());
        ro.observe(scrollRoot);
        ro.observe(content);
        const onScroll = () => {
            if (rafScroll.current != null)
                return;
            rafScroll.current = window.requestAnimationFrame(() => {
                rafScroll.current = null;
                measure();
            });
        };
        scrollRoot.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", measure);
        return () => {
            ro.disconnect();
            scrollRoot.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", measure);
            if (rafScroll.current != null)
                window.cancelAnimationFrame(rafScroll.current);
        };
    }, [measure, scrollRootRef, contentRootRef]);
    useEffect(() => {
        if (pulseEvents.length <= seenPulseCount.current)
            return;
        const nextEvents = pulseEvents.slice(seenPulseCount.current);
        seenPulseCount.current = pulseEvents.length;
        for (const evt of nextEvents) {
            const dot = dotRefMap.current.get(evt.messageId);
            if (!dot || typeof dot.animate !== "function")
                continue;
            dot.animate([
                { transform: "scale(1)", opacity: 1 },
                { transform: "scale(2.1)", opacity: 0.45, offset: 0.45 },
                { transform: "scale(1)", opacity: 1 },
            ], { duration: 520, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
        }
    }, [pulseEvents]);
    return (_jsxs("div", { className: "pointer-events-none absolute inset-y-0 left-0 z-0 w-8 select-none", "aria-hidden": true, children: [_jsx("div", { className: "absolute left-[13px] top-0 border-l border-zinc-500/25 transition-[height] duration-200", style: { height: Math.max(layout.lineHeight, 1) } }), dayKeysInOrder.map((dayKey) => {
                var _a, _b;
                const top = layout.dayCenters[dayKey];
                if (top == null)
                    return null;
                const title = formatDayTimelineTitle(dayKey, (_b = (_a = dayBuckets.find((d) => d.dayKey === dayKey)) === null || _a === void 0 ? void 0 : _a.label) !== null && _b !== void 0 ? _b : "");
                return (_jsx("div", { className: "pointer-events-auto absolute left-[9px] flex w-4 justify-center transition-[top] duration-200 ease-out", style: { top, transform: "translateY(-50%)" }, title: title, children: _jsx("span", { className: "h-3 w-3 rounded-full bg-zinc-400 shadow-sm ring-1 ring-zinc-600/30" }) }, `day-${dayKey}`));
            }), Array.from(milestoneByMessageId.entries()).map(([messageId, row]) => {
                const top = layout.messageCenters[messageId];
                if (top == null)
                    return null;
                return (_jsx("div", { className: "pointer-events-auto absolute left-0.5 flex w-3 justify-center transition-[top] duration-200 ease-out", style: { top, transform: "translateY(-50%)" }, title: row.tooltip, children: _jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-amber-400 ring-1 ring-amber-600/40" }) }, `ms-${messageId}`));
            }), orderedMessageIds.map((id) => {
                const top = layout.messageCenters[id];
                if (top == null)
                    return null;
                const m = messageById.get(id);
                if (!m)
                    return null;
                const dot = messageDotTailwindClass(m, currentProfileId);
                const title = formatMessageTimelineTitle(m, currentProfileId);
                return (_jsx("div", { className: "pointer-events-auto absolute left-[11px] flex w-3 justify-center transition-[top] duration-200 ease-out", style: { top, transform: "translateY(-50%)" }, title: title, children: _jsx("span", { ref: (el) => {
                            dotRefMap.current.set(id, el);
                        }, className: `h-2 w-2 rounded-full shadow-sm ring-1 ring-black/10 ${dot}` }) }, `msg-${id}`));
            })] }));
}
