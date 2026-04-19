"use client";

/** One visible row in pre-order traversal (respects expand/collapse). */
export interface VisibleTreeItem {
  id: string;
  depth: number;
  parentId: string | null;
  hasChildren: boolean;
  /** Effective open state (matches FolderTree `expanded[id] ?? depth < 1`). */
  isExpanded: boolean;
}

export interface TreeNodeLike {
  id: string;
  parentId: string | null;
  children: TreeNodeLike[];
}

/** Effective expand state for a node at a given depth. */
export function getEffectiveExpanded(
  id: string,
  depth: number,
  expanded: Record<string, boolean>,
): boolean {
  return expanded[id] ?? depth < 1;
}

/** Pre-order list of visible folder rows (skips children of collapsed branches). */
export function buildVisibleTreeItems(
  tree: TreeNodeLike[],
  expanded: Record<string, boolean>,
): VisibleTreeItem[] {
  const out: VisibleTreeItem[] = [];

  function walk(nodes: TreeNodeLike[], depth: number, parentId: string | null) {
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

export function indexById(items: VisibleTreeItem[]): Map<string, number> {
  return new Map(items.map((it, i) => [it.id, i]));
}
