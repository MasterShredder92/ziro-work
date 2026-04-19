import "server-only";
import { dispatchAutomationEvent } from "@/lib/automation/engine";
import type { AutomationExecution } from "@/lib/automation/types";
import type { ContentItemRow } from "@data/contentItems";

/**
 * Content triggers — dispatch automation events tied to the content library.
 * These integrate with Automation OS without requiring any changes to its
 * public types (BuiltInTrigger is `event: BuiltInTrigger | string`).
 */
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
  event: ContentTriggerEvent,
  payload: ContentTriggerPayload,
): Promise<AutomationExecution[]> {
  return dispatchAutomationEvent(event, {
    tenantId: payload.tenantId,
    profileId: payload.profileId ?? null,
    data: {
      itemId: payload.itemId,
      folderId: payload.folderId ?? null,
      tag: payload.tag,
      ...(payload.data ?? {}),
    },
  });
}

export async function fireContentItemEvent(
  event: ContentTriggerEvent,
  item: ContentItemRow,
  extras?: Record<string, unknown>,
): Promise<AutomationExecution[]> {
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
