"use client";
/** Effective expand state for a node at a given depth. */
export function getEffectiveExpanded(id, depth, expanded) {
    var _a;
    return (_a = expanded[id]) !== null && _a !== void 0 ? _a : depth < 1;
}
/** Pre-order list of visible folder rows (skips children of collapsed branches). */
export function buildVisibleTreeItems(tree, expanded) {
    const out = [];
    function walk(nodes, depth, parentId) {
        for (const n of nodes) {
            const hasChildren = n.children.length > 0;
            const isExpanded = getEffectiveExpanded(n.id, depth, expanded);
            out.push({
                id: n.id,
                depth,
                parentId,
                hasChildren,
                isExpanded,
            });
            if (hasChildren && isExpanded) {
                walk(n.children, depth + 1, n.id);
            }
        }
    }
    walk(tree, 0, null);
    return out;
}
export function indexById(items) {
    return new Map(items.map((it, i) => [it.id, i]));
}
