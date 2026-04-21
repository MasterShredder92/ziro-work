export function toFamilyDisplayProfile(family) {
    var _a, _b, _c, _d, _e;
    if (!family)
        return null;
    const name = (_c = (_b = (_a = family.name) !== null && _a !== void 0 ? _a : family.primary_contact_name) !== null && _b !== void 0 ? _b : family.parent_name) !== null && _c !== void 0 ? _c : "Family";
    const email = (_d = family.primary_email) !== null && _d !== void 0 ? _d : null;
    const phone = (_e = family.primary_phone) !== null && _e !== void 0 ? _e : null;
    const initials = name
        .split(/\s+/)
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();
    return {
        id: family.id,
        familyName: name,
        email,
        phone,
        initials: initials || "F",
    };
}
export function studentDisplayName(s) {
    var _a, _b, _c;
    const row = s;
    const first = (_a = row["first_name"]) !== null && _a !== void 0 ? _a : "";
    const last = (_b = row["last_name"]) !== null && _b !== void 0 ? _b : "";
    const preferred = (_c = row["preferred_name"]) !== null && _c !== void 0 ? _c : "";
    const display = `${first} ${last}`.trim();
    return display || preferred || s.id;
}
export function studentInitials(s) {
    var _a, _b, _c, _d;
    const row = s;
    const first = (_a = row["first_name"]) !== null && _a !== void 0 ? _a : "";
    const last = (_b = row["last_name"]) !== null && _b !== void 0 ? _b : "";
    const initials = ((_c = first[0]) !== null && _c !== void 0 ? _c : "") + ((_d = last[0]) !== null && _d !== void 0 ? _d : "");
    return initials.toUpperCase() || "S";
}
