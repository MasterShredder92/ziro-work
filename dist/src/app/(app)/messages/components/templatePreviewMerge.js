/**
 * Client-side merge for Messaging template preview.
 * Mirrors the `{{token}}` resolution in `lib/messaging/integrations.ts` (substitute),
 * except unknown or nullish values keep the placeholder (e.g. `{{firstName}}`) for preview.
 */
export function previewMergeTemplateText(input, vars) {
    if (!input)
        return "";
    return input.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_full, keyRaw) => {
        const key = String(keyRaw).trim();
        const parts = key.split(".");
        let value = vars;
        for (const p of parts) {
            if (value && typeof value === "object" && p in value) {
                value = value[p];
            }
            else {
                return `{{${key}}}`;
            }
        }
        if (value === null || value === undefined)
            return `{{${key}}}`;
        return String(value);
    });
}
