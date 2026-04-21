"use client";
function formatRelativeTime(iso) {
    const t = new Date(iso).getTime();
    if (!Number.isFinite(t))
        return "just now";
    const deltaMs = Date.now() - t;
    const absMs = Math.abs(deltaMs);
    const suffix = deltaMs >= 0 ? "ago" : "from now";
    if (absMs < 60000)
        return "just now";
    if (absMs < 3600000)
        return `${Math.round(absMs / 60000)}m ${suffix}`;
    if (absMs < 86400000)
        return `${Math.round(absMs / 3600000)}h ${suffix}`;
    return `${Math.round(absMs / 86400000)}d ${suffix}`;
}
function fullTimestamp(iso) {
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime()))
        return iso;
    return d.toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}
export function renderMessageMetadata(message) {
    const created = new Date(message.createdAt).getTime();
    const updated = new Date(message.updatedAt).getTime();
    const isEdited = !message.deletedAt && Number.isFinite(created) && Number.isFinite(updated) && updated > created;
    const timestampTooltip = fullTimestamp(message.createdAt);
    if (message.deletedAt) {
        return {
            timestampLabel: "",
            timestampTooltip,
            edited: {
                show: false,
                label: "Edited",
                tooltip: null,
            },
            deleted: {
                show: true,
                label: `Deleted ${"\u2022"} ${formatRelativeTime(message.deletedAt)}`,
                tooltip: `Deleted ${fullTimestamp(message.deletedAt)}`,
            },
        };
    }
    return {
        timestampLabel: new Date(message.createdAt).toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
        }),
        timestampTooltip,
        edited: {
            show: isEdited,
            label: "Edited",
            tooltip: isEdited
                ? `Edited ${formatRelativeTime(message.updatedAt)} ${"\u2022"} ${fullTimestamp(message.updatedAt)}`
                : null,
        },
        deleted: {
            show: false,
            label: null,
            tooltip: null,
        },
    };
}
