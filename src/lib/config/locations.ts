/**
 * Canonical location definitions for Ziro Work.
 * Single source of truth — import from here, never hardcode in components.
 */
export const LOCATIONS = [
  { id: "f7b52dd5-12ee-437f-9c60-f8adf454ac31", name: "Bellevue",  color: "#7C3AED", border: "#7C3AED40" },
  { id: "40c67ffc-91b5-46a9-94bd-6ddffdfb7638", name: "Gretna",    color: "#16A34A", border: "#16A34A40" },
  { id: "cebd97d4-c241-4de2-8ade-49e5cc0070d5", name: "Elkhorn",   color: "#0EA5E9", border: "#0EA5E940" },
  { id: "d48229c1-b70a-4d29-893e-5079887dab76", name: "Omaha",     color: "#DC2626", border: "#DC262640" },
] as const;

export type LocationId = typeof LOCATIONS[number]["id"];

export const LOCATION_MAP: Record<string, { name: string; color: string; border: string }> =
  Object.fromEntries(LOCATIONS.map((l) => [l.id, { name: l.name, color: l.color, border: l.border }]));

export function locationColor(locationId: string | null | undefined): string {
  if (!locationId) return "#505055";
  return LOCATION_MAP[locationId]?.color ?? "#505055";
}

export function locationName(locationId: string | null | undefined): string {
  if (!locationId) return "Unknown";
  return LOCATION_MAP[locationId]?.name ?? "Unknown";
}
