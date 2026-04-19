"use client";

export type FilesToastKind = "success" | "error" | "info";

export const FILES_TOAST_EVENT = "ziro-files-toast";

export function showFilesToast(message: string, kind: FilesToastKind = "info") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(FILES_TOAST_EVENT, { detail: { message, kind } }),
  );
}
