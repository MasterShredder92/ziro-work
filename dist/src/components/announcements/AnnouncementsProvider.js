"use client";
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { getLatestChangelogEntry } from "@/lib/changelog/entries";
import { AnnouncementBanner } from "./AnnouncementBanner";
import { AnnouncementModal } from "./AnnouncementModal";
import { FounderLaunchModal } from "./FounderLaunchModal";
const DISMISS_KEY = "ziro.announcement.dismissedVersion";
const SURFACE_KEY = "ziro.announcement.surface";
const LAUNCH_SEEN_KEY = "ziro.launchSeen";
function readDismissed() {
    try {
        return localStorage.getItem(DISMISS_KEY);
    }
    catch (_a) {
        return null;
    }
}
function readSurface() {
    try {
        return localStorage.getItem(SURFACE_KEY) === "modal" ? "modal" : "banner";
    }
    catch (_a) {
        return "banner";
    }
}
function readLaunchSeen() {
    try {
        return localStorage.getItem(LAUNCH_SEEN_KEY);
    }
    catch (_a) {
        return null;
    }
}
export function AnnouncementsProvider() {
    var _a, _b;
    const latest = React.useMemo(() => getLatestChangelogEntry(), []);
    const [dismissed, setDismissed] = React.useState(null);
    const [surface, setSurface] = React.useState("banner");
    const [hydrated, setHydrated] = React.useState(false);
    const [detailsOpen, setDetailsOpen] = React.useState(false);
    const [launchHandled, setLaunchHandled] = React.useState(false);
    const dismiss = React.useCallback(() => {
        var _a;
        const version = (_a = getLatestChangelogEntry()) === null || _a === void 0 ? void 0 : _a.version;
        if (!version)
            return;
        try {
            localStorage.setItem(DISMISS_KEY, version);
        }
        catch (_b) {
            /* ignore */
        }
        setDismissed(version);
        setDetailsOpen(false);
    }, []);
    const acknowledgeLaunch = React.useCallback(() => {
        var _a;
        const version = (_a = getLatestChangelogEntry()) === null || _a === void 0 ? void 0 : _a.version;
        if (!version)
            return;
        try {
            localStorage.setItem(LAUNCH_SEEN_KEY, version);
            localStorage.setItem(DISMISS_KEY, version);
        }
        catch (_b) {
            /* ignore */
        }
        setLaunchHandled(true);
        setDismissed(version);
        setDetailsOpen(false);
    }, []);
    React.useEffect(() => {
        var _a;
        setDismissed(readDismissed());
        setSurface(readSurface());
        const v = (_a = getLatestChangelogEntry()) === null || _a === void 0 ? void 0 : _a.version;
        if (v) {
            try {
                setLaunchHandled(readLaunchSeen() === v);
            }
            catch (_b) {
                setLaunchHandled(false);
            }
        }
        setHydrated(true);
    }, []);
    if (!latest)
        return null;
    if (!hydrated)
        return null;
    const launchTagged = Boolean((_a = latest.tags) === null || _a === void 0 ? void 0 : _a.includes("launch"));
    if (launchTagged && !launchHandled) {
        return (_jsx(FounderLaunchModal, { open: true, version: latest.version, highlights: latest.highlights, onAcknowledge: acknowledgeLaunch }));
    }
    const active = dismissed !== latest.version;
    if (!active)
        return null;
    const summary = (_b = latest.highlights[0]) !== null && _b !== void 0 ? _b : "Open the changelog for the full rundown.";
    const detailText = latest.highlights.join(" · ");
    if (surface === "modal") {
        return (_jsx(AnnouncementModal, { open: true, title: `What’s new in ${latest.version}`, description: detailText, onClose: dismiss }));
    }
    return (_jsxs(_Fragment, { children: [_jsx(AnnouncementBanner, { title: `What’s new in ${latest.version}`, description: summary, onClose: dismiss, onDetails: () => setDetailsOpen(true) }), _jsx(AnnouncementModal, { open: detailsOpen, title: `${latest.version} highlights`, description: detailText, onClose: () => setDetailsOpen(false) })] }));
}
