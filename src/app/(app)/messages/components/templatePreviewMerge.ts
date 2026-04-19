/**
 * Client-side merge for Messaging template preview.
 * Mirrors the `{{token}}` resolution in `lib/messaging/integrations.ts` (substitute),
 * except unknown or nullish values keep the placeholder (e.g. `{{firstName}}`) for preview.
 */

export type MessagingTemplateOption = {
  id: string;
  name: string;
  body: string;
  subject?: string | null;
  bodyHtml?: string | null;
};

export function previewMergeTemplateText(
  input: string | null | undefined,
  vars: Record<string, unknown>,
): string {
  if (!input) return "";
  return input.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_full, keyRaw: string) => {
    const key = String(keyRaw).trim();
    const parts = key.split(".");
    let value: unknown = vars;
    for (const p of parts) {
      if (value && typeof value === "object" && p in (value as object)) {
        value = (value as Record<string, unknown>)[p];
      } else {
        return `{{${key}}}`;
      }
    }
    if (value === null || value === undefined) return `{{${key}}}`;
    return String(value);
  });
}
