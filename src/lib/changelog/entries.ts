export type ChangelogRelease = {
  version: string;
  date: string;
  highlights: string[];
  /** Optional tags for in-app surfaces (e.g. `launch` founder modal). */
  tags?: string[];
};

/** Static releases (UI / announcements only). */
export const CHANGELOG_ENTRIES: ChangelogRelease[] = [
  {
    version: "0.4.0",
    date: "2026-04-17",
    tags: ["launch"],
    highlights: [
      "Settings framework with tenant-aware studio panels.",
      "Studio Map orb view for teacher rosters.",
      "Student profile depth: invoices, schedule, and risk cards.",
    ],
  },
  {
    version: "0.3.2",
    date: "2026-04-10",
    highlights: [
      "Command palette refinements and faster route hints.",
      "Notification stream pagination hardening.",
    ],
  },
  {
    version: "0.3.0",
    date: "2026-04-01",
    highlights: [
      "Lifecycle surfaces aligned to charcoal + neon tokens.",
      "Dashboard activity feed virtualization.",
    ],
  },
];

export function getLatestChangelogEntry(): ChangelogRelease | null {
  return CHANGELOG_ENTRIES[0] ?? null;
}
