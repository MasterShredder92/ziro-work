"use client";
import { useLayoutEffect, useRef, useState } from "react";
const DURATION_MS = 200;
/**
 * Animates a block from height 0 ↔ natural height, ending in `height: auto` when open
 * so nested content can grow without layout jumps.
 */
export function useAutoHeightTransition(isExpanded, 
/** When this changes while expanded, height stays `auto` and layout updates naturally. */
contentSignal) {
    const innerRef = useRef(null);
    const [height, setHeight] = useState(() => isExpanded ? "auto" : 0);
    const prevExpandedRef = useRef(null);
    useLayoutEffect(() => {
        var _a;
        const inner = innerRef.current;
        const prev = prevExpandedRef.current;
        if (prev === null) {
            prevExpandedRef.current = isExpanded;
            return;
        }
        if (isExpanded && !prev) {
            const h = (_a = inner === null || inner === void 0 ? void 0 : inner.scrollHeight) !== null && _a !== void 0 ? _a : 0;
            requestAnimationFrame(() => {
                setHeight(0);
                requestAnimationFrame(() => {
                    setHeight(h);
                });
            });
            prevExpandedRef.current = isExpanded;
            return;
        }
        if (!isExpanded && prev) {
            requestAnimationFrame(() => {
                var _a, _b;
                const h = (_b = (_a = innerRef.current) === null || _a === void 0 ? void 0 : _a.scrollHeight) !== null && _b !== void 0 ? _b : 0;
                setHeight(h);
                requestAnimationFrame(() => {
                    setHeight(0);
                });
            });
            prevExpandedRef.current = isExpanded;
            return;
        }
        if (!isExpanded && !prev) {
            requestAnimationFrame(() => {
                setHeight(0);
            });
        }
        prevExpandedRef.current = isExpanded;
    }, [isExpanded, contentSignal]);
    const onTransitionEnd = (e) => {
        if (e.propertyName !== "height")
            return;
        if (e.target !== e.currentTarget)
            return;
        if (isExpanded) {
            setHeight("auto");
        }
    };
    const outerStyle = {
        height: height === "auto" ? "auto" : `${height}px`,
        transition: `height ${DURATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
    };
    return { innerRef, outerStyle, onTransitionEnd };
}
