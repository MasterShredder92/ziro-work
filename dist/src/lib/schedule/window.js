const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 14;
function toUtcDate(value) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}
export function toIsoDate(value) {
    return toUtcDate(value).toISOString().slice(0, 10);
}
export function parseIsoDate(value) {
    return new Date(`${value}T00:00:00.000Z`);
}
export function addDays(isoDate, days) {
    const next = new Date(parseIsoDate(isoDate).getTime() + days * DAY_MS);
    return toIsoDate(next);
}
export function twoWeekWindowFrom(startIso) {
    return { start: startIso, end: addDays(startIso, WINDOW_DAYS - 1) };
}
export function twoWeekWindowFromToday() {
    return twoWeekWindowFrom(toIsoDate(new Date()));
}
/** Returns a Monday-anchored 7-day window (Mon-Sun) containing the given date */
export function weekWindowContaining(isoDate) {
    const d = parseIsoDate(isoDate);
    const dow = d.getUTCDay(); // 0=Sun
    const daysToMonday = dow === 0 ? -6 : 1 - dow;
    const monday = toIsoDate(new Date(d.getTime() + daysToMonday * DAY_MS));
    return { start: monday, end: addDays(monday, 6) };
}
export function weekWindowFromToday() {
    return weekWindowContaining(toIsoDate(new Date()));
}
export function shiftWindowByOneWeek(startIso, direction) {
    return weekWindowContaining(addDays(startIso, direction * 7));
}
export function shiftWindowByWeeks(startIso, weeks) {
    return twoWeekWindowFrom(addDays(startIso, weeks * 7));
}
export function eachDayInclusive(startIso, endIso) {
    const out = [];
    const start = parseIsoDate(startIso).getTime();
    const end = parseIsoDate(endIso).getTime();
    for (let t = start; t <= end; t += DAY_MS) {
        out.push(toIsoDate(new Date(t)));
    }
    return out;
}
export function clampWindowLength(window, maxDays = WINDOW_DAYS) {
    const start = parseIsoDate(window.start).getTime();
    const end = parseIsoDate(window.end).getTime();
    const spanDays = Math.floor((end - start) / DAY_MS) + 1;
    return spanDays > 0 && spanDays <= maxDays;
}
