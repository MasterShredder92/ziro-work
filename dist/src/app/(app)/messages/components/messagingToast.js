"use client";
export const MESSAGING_TOAST_EVENT = "ziro-messaging-toast";
export function showMessagingToast(message, kind) {
    if (typeof window === "undefined")
        return;
    window.dispatchEvent(new CustomEvent(MESSAGING_TOAST_EVENT, { detail: { message, kind } }));
}
