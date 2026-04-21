"use client";
import * as React from "react";
export const NotificationsContext = React.createContext(null);
export function useNotifications() {
    const ctx = React.useContext(NotificationsContext);
    if (!ctx) {
        throw new Error("useNotifications must be used within NotificationsProvider");
    }
    return ctx;
}
