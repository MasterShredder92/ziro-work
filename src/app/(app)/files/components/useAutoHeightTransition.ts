"use client";

import type { CSSProperties, RefObject, TransitionEvent } from "react";
import { useLayoutEffect, useRef, useState } from "react";

const DURATION_MS = 200;

export interface AutoHeightTransition {
  innerRef: RefObject<HTMLDivElement | null>;
  outerStyle: CSSProperties;
  onTransitionEnd: (e: TransitionEvent<HTMLDivElement>) => void;
}

/**
 * Animates a block from height 0 ↔ natural height, ending in `height: auto` when open
 * so nested content can grow without layout jumps.
 */
export function useAutoHeightTransition(
  isExpanded: boolean,
  /** When this changes while expanded, height stays `auto` and layout updates naturally. */
  contentSignal: string,
): AutoHeightTransition {
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number | "auto">(() =>
    isExpanded ? "auto" : 0,
  );
  const prevExpandedRef = useRef<boolean | null>(null);

  useLayoutEffect(() => {
    const inner = innerRef.current;
    const prev = prevExpandedRef.current;

    if (prev === null) {
      prevExpandedRef.current = isExpanded;
      return;
    }

    if (isExpanded && !prev) {
      const h = inner?.scrollHeight ?? 0;
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
        const h = innerRef.current?.scrollHeight ?? 0;
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

  const onTransitionEnd = (e: TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName !== "height") return;
    if (e.target !== e.currentTarget) return;
    if (isExpanded) {
      setHeight("auto");
    }
  };

  const outerStyle: CSSProperties = {
    height: height === "auto" ? "auto" : `${height}px`,
    transition: `height ${DURATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
  };

  return { innerRef, outerStyle, onTransitionEnd };
}
