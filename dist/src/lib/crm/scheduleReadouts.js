const DAY_ORDER = {
    monday: 0,
    tuesday: 1,
    wednesday: 2,
    thursday: 3,
    friday: 4,
    saturday: 5,
    sunday: 6,
};
function dayRank(day) {
    var _a;
    if (!day)
        return 99;
    const k = day.trim().toLowerCase();
    return (_a = DAY_ORDER[k]) !== null && _a !== void 0 ? _a : 99;
}
/**
 * Read-only “next lesson” line from recurring-style blocks (day + local times).
 * Picks the earliest weekday in the week, then earliest start time.
 */
export function summarizeNextLesson(entries) {
    var _a, _b, _c;
    if (!entries.length)
        return null;
    const sorted = [...entries].sort((a, b) => {
        var _a, _b;
        const da = dayRank(a.dayOfWeek);
        const db = dayRank(b.dayOfWeek);
        if (da !== db)
            return da - db;
        const ta = (_a = a.startsAt) !== null && _a !== void 0 ? _a : "";
        const tb = (_b = b.startsAt) !== null && _b !== void 0 ? _b : "";
        return ta.localeCompare(tb);
    });
    const s = sorted[0];
    const day = (_a = s.dayOfWeek) !== null && _a !== void 0 ? _a : "Lesson";
    const span = s.startsAt && s.endsAt
        ? `${s.startsAt}–${s.endsAt}`
        : ((_c = (_b = s.startsAt) !== null && _b !== void 0 ? _b : s.endsAt) !== null && _c !== void 0 ? _c : "");
    return span ? `${day} · ${span}` : day;
}
