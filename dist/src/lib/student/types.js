export function toStudentDisplayProfile(student) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    if (!student)
        return null;
    const row = student;
    const first = (_a = row["first_name"]) !== null && _a !== void 0 ? _a : "";
    const last = (_b = row["last_name"]) !== null && _b !== void 0 ? _b : "";
    const preferred = (_c = row["preferred_name"]) !== null && _c !== void 0 ? _c : "";
    const email = (_d = row["email"]) !== null && _d !== void 0 ? _d : null;
    const instrument = (_e = row["instrument"]) !== null && _e !== void 0 ? _e : null;
    const teacherName = (_g = (_f = row["first_teacher_name"]) !== null && _f !== void 0 ? _f : row["last_teacher_name"]) !== null && _g !== void 0 ? _g : null;
    const fullName = `${first} ${last}`.trim() || preferred || email || student.id;
    const initials = (((_h = first[0]) !== null && _h !== void 0 ? _h : "") + ((_j = last[0]) !== null && _j !== void 0 ? _j : "")).toUpperCase() ||
        ((_k = preferred[0]) !== null && _k !== void 0 ? _k : "S").toUpperCase();
    return {
        id: student.id,
        fullName,
        firstName: first || preferred || fullName,
        lastName: last,
        email,
        initials: initials.slice(0, 2),
        instrument,
        teacherName,
    };
}
