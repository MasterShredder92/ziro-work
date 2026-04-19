"use client";

import * as React from "react";
import { getLatestChangelogEntry } from "@/lib/changelog/entries";
import { AnnouncementBanner } from "./AnnouncementBanner";
import { AnnouncementModal } from "./AnnouncementModal";
import { FounderLaunchModal } from "./FounderLaunchModal";

const DISMISS_KEY = "ziro.announcement.dismissedVersion";
const SURFACE_KEY = "ziro.announcement.surface";
const LAUNCH_SEEN_KEY = "ziro.launchSeen";

function readDismissed(): string | null {
  try {
    return localStorage.getItem(DISMISS_KEY);
  } catch {
    return null;
  }
}

function readSurface(): "banner" | "modal" {
  try {
    return localStorage.getItem(SURFACE_KEY) === "modal" ? "modal" : "banner";
  } catch {
    return "banner";
  }
}

function readLaunchSeen(): string | null {
  try {
    return localStorage.getItem(LAUNCH_SEEN_KEY);
  } catch {
    return null;
  }
}

export function AnnouncementsProvider() {
  const latest = React.useMemo(() => getLatestChangelogEntry(), []);
  const [dismissed, setDismissed] = React.useState<string | null>(null);
  const [surface, setSurface] = React.useState<"banner" | "modal">("banner");
  const [hydrated, setHydrated] = React.useState(false);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [launchHandled, setLaunchHandled] = React.useState(false);

  const dismiss = React.useCallback(() => {
    const version = getLatestChangelogEntry()?.version;
    if (!version) return;
    try {
      localStorage.setItem(DISMISS_KEY, version);
    } catch {
      /* ignore */
    }
    setDismissed(version);
    setDetailsOpen(false);
  }, []);

  const acknowledgeLaunch = React.useCallback(() => {
    const version = getLatestChangelogEntry()?.version;
    if (!version) return;
    try {
      localStorage.setItem(LAUNCH_SEEN_KEY, version);
      localStorage.setItem(DISMISS_KEY, version);
    } catch {
      /* ignore */
    }
    setLaunchHandled(true);
    setDismissed(version);
    setDetailsOpen(false);
  }, []);

  React.useEffect(() => {
    setDismissed(readDismissed());
    setSurface(readSurface());
    const v = getLatestChangelogEntry()?.version;
    if (v) {
      try {
        setLaunchHandled(readLaunchSeen() === v);
      } catch {
        setLaunchHandled(false);
      }
    }
    setHydrated(true);
  }, []);

  if (!latest) return null;

  if (!hydrated) return null;

  const launchTagged = Boolean(latest.tags?.includes("launch"));

  if (launchTagged && !launchHandled) {
    return (
      <FounderLaunchModal
        open
        version={latest.version}
        highlights={latest.highlights}
        onAcknowledge={acknowledgeLaunch}
      />
    );
  }

  const active = dismissed !== latest.version;
  if (!active) return null;

  const summary = latest.highlights[0] ?? "Open the changelog for the full rundown.";
  const detailText = latest.highlights.join(" · ");

  if (surface === "modal") {
    return (
      <AnnouncementModal
        open
        title={`What’s new in ${latest.version}`}
        description={detailText}
        onClose={dismiss}
      />
    );
  }

  return (
    <>
      <AnnouncementBanner
        title={`What’s new in ${latest.version}`}
        description={summary}
        onClose={dismiss}
        onDetails={() => setDetailsOpen(true)}
      />
      <AnnouncementModal
        open={detailsOpen}
        title={`${latest.version} highlights`}
        description={detailText}
        onClose={() => setDetailsOpen(false)}
      />
    </>
  );
}
