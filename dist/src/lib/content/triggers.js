import "server-only";
import { dispatchAutomationEvent } from "@/lib/automation/engine";
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
];
export async function fireContentTrigger(event, payload) {
    var _a, _b, _c;
    return dispatchAutomationEvent(event, {
        tenantId: payload.tenantId,
        profileId: (_a = payload.profileId) !== null && _a !== void 0 ? _a : null,
        data: Object.assign({ itemId: payload.itemId, folderId: (_b = payload.folderId) !== null && _b !== void 0 ? _b : null, tag: payload.tag }, ((_c = payload.data) !== null && _c !== void 0 ? _c : {})),
    });
}
export async function fireContentItemEvent(event, item, extras) {
    var _a, _b;
    return fireContentTrigger(event, {
        tenantId: item.tenant_id,
        itemId: item.id,
        folderId: item.folder_id,
        profileId: (_b = (_a = item.updated_by) !== null && _a !== void 0 ? _a : item.author_id) !== null && _b !== void 0 ? _b : null,
        data: Object.assign({ title: item.title, kind: item.kind, contentType: item.content_type, visibility: item.visibility, tags: item.tags }, (extras !== null && extras !== void 0 ? extras : {})),
    });
}
