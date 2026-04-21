export function toTeacherDisplayProfile(teacher) {
    var _a, _b, _c, _d, _e;
    if (!teacher)
        return null;
    const first = (_a = teacher["first_name"]) !== null && _a !== void 0 ? _a : "";
    const last = (_b = teacher["last_name"]) !== null && _b !== void 0 ? _b : "";
    const display = (_c = teacher["display_name"]) !== null && _c !== void 0 ? _c : "";
    const email = (_d = teacher["email"]) !== null && _d !== void 0 ? _d : null;
    const photoUrl = (_e = teacher["photo_url"]) !== null && _e !== void 0 ? _e : null;
    const fullName = display.trim() ||
        `${first} ${last}`.trim() ||
        email ||
        teacher.id;
    const initials = (first ? first[0] : "") + (last ? last[0] : "") ||
        (display ? display[0] : "") ||
        "T";
    return {
        id: teacher.id,
        fullName,
        email,
        photoUrl,
        initials: initials.toUpperCase().slice(0, 2),
    };
}
