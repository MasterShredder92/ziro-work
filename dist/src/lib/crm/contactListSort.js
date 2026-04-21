const SORTABLE = new Set([
    "name",
    "role",
    "email",
    "phone",
    "stage_status",
    "updated",
]);
export function parseContactSortParams(sort, dir) {
    if (!sort || !SORTABLE.has(sort))
        return { sortKey: null, sortDir: null };
    if (dir !== "asc" && dir !== "desc")
        return { sortKey: null, sortDir: null };
    return { sortKey: sort, sortDir: dir };
}
function stageLabel(c) {
    var _a, _b;
    return ((_b = (_a = c.stage) !== null && _a !== void 0 ? _a : c.status) !== null && _b !== void 0 ? _b : "").toString();
}
export function sortContactsList(rows, sortKey, sortDir) {
    if (!sortKey || !sortDir || !SORTABLE.has(sortKey))
        return rows;
    const m = sortDir === "asc" ? 1 : -1;
    const copy = [...rows];
    copy.sort((a, b) => {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        let va = "";
        let vb = "";
        switch (sortKey) {
            case "name":
                va = (_a = a.fullName) !== null && _a !== void 0 ? _a : "";
                vb = (_b = b.fullName) !== null && _b !== void 0 ? _b : "";
                break;
            case "role":
                va = (_c = a.kind) !== null && _c !== void 0 ? _c : "";
                vb = (_d = b.kind) !== null && _d !== void 0 ? _d : "";
                break;
            case "email":
                va = (_e = a.email) !== null && _e !== void 0 ? _e : "";
                vb = (_f = b.email) !== null && _f !== void 0 ? _f : "";
                break;
            case "phone":
                va = (_g = a.phone) !== null && _g !== void 0 ? _g : "";
                vb = (_h = b.phone) !== null && _h !== void 0 ? _h : "";
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
