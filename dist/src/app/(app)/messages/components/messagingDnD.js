/** Drag-and-drop helpers for Messaging OS composers (file drags only). */
export function isFileDragTransfer(dt) {
    if (!dt)
        return false;
    return Array.from(dt.types).includes("Files");
}
/** True when leaving `container` for an element outside it (or focus moved outside). */
export function isDragLeaveToOutside(e, container) {
    const next = e.relatedTarget;
    if (!next || !(next instanceof Node))
        return true;
    return !container.contains(next);
}
