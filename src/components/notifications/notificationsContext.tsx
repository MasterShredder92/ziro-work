"use client";

import * as React from "react";
import type { EventLog } from "@/lib/data/models";

export type NotificationsContextValue = {
  events: EventLog[];
  unreadCount: number;
  isEventRead: (id: string) => boolean;
  panelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  loadMoreEvents: () => void;
  hasMoreEvents: boolean;
  eventsLoading: boolean;
};

export const NotificationsContext = React.createContext<NotificationsContextValue | null>(null);

export function useNotifications() {
  const ctx = React.useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return ctx;
}
