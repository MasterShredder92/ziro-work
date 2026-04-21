export function dayKeyFromIso(iso) {
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime()))
        return "invalid";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function formatDayDividerLabel(iso) {
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime()))
        return "";
    const now = new Date();
    const opts = {
        weekday: "long",
        month: "long",
        day: "numeric",
    };
    if (d.getFullYear() !== now.getFullYear())
        opts.year = "numeric";
    return d.toLocaleDateString(undefined, opts);
}
export function formatMessageTime(iso) {
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime()))
        return "";
    return d.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
    });
}
export function groupMessagesByDay(messages) {
    const sorted = [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const out = [];
    for (const m of sorted) {
        const dayKey = dayKeyFromIso(m.createdAt);
        const label = formatDayDividerLabel(m.createdAt);
        const prev = out[out.length - 1];
        if (!prev || prev.dayKey !== dayKey) {
            out.push({ dayKey, label, messages: [m] });
        }
        else {
            prev.messages.push(m);
        }
    }
    return out;
}
/** Heuristic for optional centered system lines (no bubble). */
export function isLikelySystemMessage(m) {
    var _a;
    const t = m.body.trim();
    if (!t)
        return false;
    if (/^system\b/i.test((_a = m.senderName) !== null && _a !== void 0 ? _a : ""))
        return true;
    return (/^You started this conversation\.?$/i.test(t) ||
        /^This conversation was (created|started)\.?$/i.test(t));
}
/**
 * Split a chronological day list into runs of the same sender.
 * System messages always break into their own single-message run.
 */
export function splitIntoSenderRuns(dayMessages) {
    const runs = [];
    let current = [];
    const flush = () => {
        if (current.length) {
            runs.push(current);
            current = [];
        }
    };
    for (const m of dayMessages) {
        if (isLikelySystemMessage(m)) {
            flush();
            runs.push([m]);
            continue;
        }
        const head = current[0];
        const prev = current[current.length - 1];
        const prevTs = prev ? new Date(prev.createdAt).getTime() : 0;
        const nextTs = new Date(m.createdAt).getTime();
        const breaksByGap = Number.isFinite(prevTs) &&
            Number.isFinite(nextTs) &&
            Math.abs(nextTs - prevTs) > 10 * 60000;
        if (!head || head.senderId !== m.senderId || breaksByGap) {
            flush();
            current = [m];
        }
        else {
            current.push(m);
        }
    }
    flush();
    return runs;
}
