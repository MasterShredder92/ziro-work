export function toLeadDisplayProfile(lead) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    const row = lead;
    const first = (_a = row["first_name"]) !== null && _a !== void 0 ? _a : "";
    const last = (_b = row["last_name"]) !== null && _b !== void 0 ? _b : "";
    const parent = (_c = row["parent_name"]) !== null && _c !== void 0 ? _c : "";
    const studentName = (_d = row["student_name"]) !== null && _d !== void 0 ? _d : "";
    const email = (_e = row["email"]) !== null && _e !== void 0 ? _e : null;
    const phone = (_f = row["phone"]) !== null && _f !== void 0 ? _f : null;
    const instrument = (_g = row["instrument"]) !== null && _g !== void 0 ? _g : null;
    const source = (_h = row["source"]) !== null && _h !== void 0 ? _h : null;
    const stage = (_j = row["stage"]) !== null && _j !== void 0 ? _j : "new";
    const fullName = `${first} ${last}`.trim() ||
        studentName ||
        parent ||
        email ||
        lead.id;
    const initials = (((_k = first[0]) !== null && _k !== void 0 ? _k : "") + ((_l = last[0]) !== null && _l !== void 0 ? _l : "")).toUpperCase() ||
        ((_o = (_m = parent[0]) !== null && _m !== void 0 ? _m : studentName[0]) !== null && _o !== void 0 ? _o : "L").toUpperCase();
    return {
        id: lead.id,
        fullName,
        email,
        phone,
        initials: initials.slice(0, 2),
        stage,
        source,
        instrument,
    };
}
