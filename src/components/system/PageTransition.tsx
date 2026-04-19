"use client";

import * as React from "react";
import { cn } from "@/components/ui/utils";

export type PageTransitionProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Entry motion for routed surfaces: fade + slight upward slide.
 * Uses tokens from src/styles/animations.css (--z-duration-medium, --z-ease-smooth).
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  return <div className={cn("z-page-transition", className)}>{children}</div>;
}
