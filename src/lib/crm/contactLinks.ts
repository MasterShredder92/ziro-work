import type { ContactKind } from "@/lib/types/crm";

/** Deep link to the canonical CRM profile for a contact row (not the unified contact shell). */
export function crmProfileHref(kind: ContactKind, sourceId: string): string {
  switch (kind) {
    case "student":
      return `/crm/students/${encodeURIComponent(sourceId)}`;
    case "family":
      return `/crm/families/${encodeURIComponent(sourceId)}`;
    case "teacher":
      return `/crm/teachers/${encodeURIComponent(sourceId)}`;
    case "lead":
      return `/crm/leads/${encodeURIComponent(sourceId)}`;
    default:
      return `/crm/contacts`;
  }
}
