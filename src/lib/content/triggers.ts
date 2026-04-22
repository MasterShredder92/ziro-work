import "server-only";
// automation removed — triggers are no-ops until agents are rebuilt
import type { ContentItemRow } from "@data/contentItems";

export const CONTENT_TRIGGER_EVENTS = [
  "content.created",
  "content.updated",
  "content.published",
  "content.archived",
  "content.version.created",
  "content.version.restored",
  "content.tagged",
  "content.moved",
  "content.deleted",
  "content.asset.uploaded",
  "content.viewed",
] as const;

export type ContentTriggerEvent = (typeof CONTENT_TRIGGER_EVENTS)[number];

export type ContentTriggerPayload = {
  tenantId: string;
  itemId?: string;
  folderId?: string | null;
  tag?: string;
  profileId?: string | null;
  data?: Record<string, unknown>;
};

export async function fireContentTrigger(
  _event: ContentTriggerEvent,
  _payload: ContentTriggerPayload,
): Promise<void> {
  // no-op until automation agents are rebuilt
}

export async function fireContentItemEvent(
  event: ContentTriggerEvent,
  item: ContentItemRow,
  extras?: Record<string, unknown>,
): Promise<void> {
  return fireContentTrigger(event, {
    tenantId: item.tenant_id,
    itemId: item.id,
    folderId: item.folder_id,
    profileId: item.updated_by ?? item.author_id ?? null,
    data: {
      title: item.title,
      kind: item.kind,
      contentType: item.content_type,
      visibility: item.visibility,
      tags: item.tags,
      ...(extras ?? {}),
    },
  });
}
