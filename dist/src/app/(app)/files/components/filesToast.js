"use client";
export const FILES_TOAST_EVENT = "ziro-files-toast";
export function showFilesToast(message, kind = "info") {
    if (typeof window === "undefined")
        return;
    window.dispatchEvent(new CustomEvent(FILES_TOAST_EVENT, { detail: { message, kind } }));
}
