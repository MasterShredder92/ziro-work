import type { Contact } from "@/lib/types/crm";

const SORTABLE = new Set([
  "name",
  "role",
  "email",
  "phone",
  "stage_status",
  "updated",
]);

export function parseContactSortParams(
  sort: string | undefined,
  dir: string | undefined,
): { sortKey: string | null; sortDir: "asc" | "desc" | null } {
  if (!sort || !SORTABLE.has(sort)) return { sortKey: null, sortDir: null };
  if (dir !== "asc" && dir !== "desc") return { sortKey: null, sortDir: null };
  return { sortKey: sort, sortDir: dir };
}

function stageLabel(c: Contact): string {
  return (c.stage ?? c.status ?? "").toString();
}

export function sortContactsList(
  rows: Contact[],
  sortKey: string | null,
  sortDir: "asc" | "desc" | null,
): Contact[] {
  if (!sortKey || !sortDir || !SORTABLE.has(sortKey)) return rows;
  const m = sortDir === "asc" ? 1 : -1;
  const copy = [...rows];
  copy.sort((a, b) => {
    let va = "";
    let vb = "";
    switch (sortKey) {
      case "name":
        va = a.fullName ?? "";
        vb = b.fullName ?? "";
        break;
      case "role":
        va = a.kind ?? "";
        vb = b.kind ?? "";
        break;
      case "email":
        va = a.email ?? "";
        vb = b.email ?? "";
        break;
      case "phone":
        va = a.phone ?? "";
        vb = b.phone ?? "";
        break;
      case "stage_status":
        va = stageLabel(a);
        vb = stageLabel(b);
        break;
      case "updated": {
        const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return (ta - tb) * m;
      }
      default:
        return 0;
    }
    return va.localeCompare(vb, undefined, { sensitivity: "base" }) * m;
  });
  return copy;
}
