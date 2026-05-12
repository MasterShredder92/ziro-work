/**
 * Studio rooms are often stored as location-prefixed codes (e.g. BELLEVUE_3).
 * In the UI we show a short in-location label: "Room 3".
 * Names that do not match the code pattern are returned unchanged.
 */

/** e.g. BELLEVUE_3, ELKHORN_12 — prefix + underscore + digits only at end. */
const STUDIO_ROOM_CODE = /^[A-Za-z][A-Za-z0-9]*_(\d+)$/;
const ROOM_WORD = /^room\s*(\d+)\s*$/i;

export function roomDisplayName(technicalName: string | null | undefined): string {
  const raw = technicalName?.trim();
  if (!raw) return "Room";
  const code = raw.match(STUDIO_ROOM_CODE);
  if (code) return `Room ${code[1]}`;
  const rw = raw.match(ROOM_WORD);
  if (rw) return `Room ${rw[1]}`;
  return raw;
}

/** Compact badge text (e.g. "3" for BELLEVUE_3); falls back to first two letters. */
export function roomDisplayShortBadge(technicalName: string | null | undefined): string {
  const label = roomDisplayName(technicalName);
  const m = label.match(/^Room (\d+)$/);
  if (m) return m[1] ?? label;
  return label.slice(0, 2).toUpperCase();
}
