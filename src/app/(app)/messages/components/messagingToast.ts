"use client";

export type MessagingToastKind = "success" | "error";

export const MESSAGING_TOAST_EVENT = "ziro-messaging-toast";

export function showMessagingToast(
  message: string,
  kind: MessagingToastKind,
) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(MESSAGING_TOAST_EVENT, { detail: { message, kind } }),
  );
}
