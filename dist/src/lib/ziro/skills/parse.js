const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const PHONE_RE = /(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/;
const AMOUNT_RE = /\$?\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/;
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const ISO_DATE_RE = /\b\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:?\d{2})?)?\b/;
const US_DATE_RE = /\b(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?\b/;
const TIME_RE = /\b(\d{1,2}):(\d{2})\s?(am|pm|AM|PM)?\b/;
const NAME_RE = /\b([A-Z][a-z'’-]+)(?:\s+([A-Z][a-z'’-]+))?\b/;
export function normalize(input) {
    return (input !== null && input !== void 0 ? input : "").trim();
}
export function extractEmail(input) {
    const m = input.match(EMAIL_RE);
    return m ? m[0] : null;
}
export function extractPhone(input) {
    const m = input.match(PHONE_RE);
    return m ? m[0].trim() : null;
}
export function extractAmount(input) {
    const idx = input.search(/\$\s?\d/);
    const source = idx >= 0 ? input.slice(idx) : input;
    const m = source.match(AMOUNT_RE);
    if (!m)
        return null;
    const raw = m[1];
    const value = Number(raw.replace(/,/g, ""));
    if (!Number.isFinite(value))
        return null;
    return { value, raw };
}
export function extractId(input) {
    const m = input.match(UUID_RE);
    return m ? m[0] : null;
}
export function extractDate(input) {
    const iso = input.match(ISO_DATE_RE);
    if (iso)
        return iso[0];
    const us = input.match(US_DATE_RE);
    if (us) {
        const [, mm, dd, yy] = us;
        const year = yy ? (yy.length === 2 ? `20${yy}` : yy) : String(new Date().getFullYear());
        return `${year}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
    }
    return null;
}
export function extractTime(input) {
    var _a;
    const m = input.match(TIME_RE);
    if (!m)
        return null;
    let hour = Number(m[1]);
    const minute = m[2];
    const meridiem = (_a = m[3]) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    if (meridiem === "pm" && hour < 12)
        hour += 12;
    if (meridiem === "am" && hour === 12)
        hour = 0;
    return `${String(hour).padStart(2, "0")}:${minute}`;
}
export function extractName(input) {
    const cleaned = input
        .replace(EMAIL_RE, " ")
        .replace(PHONE_RE, " ")
        .replace(UUID_RE, " ");
    const m = cleaned.match(NAME_RE);
    if (!m)
        return null;
    return (m[2] ? `${m[1]} ${m[2]}` : m[1]).trim();
}
const STOPWORDS = new Set([
    "the", "and", "for", "with", "from", "to", "of", "a", "an", "in", "on",
    "at", "is", "are", "was", "were", "be", "by", "as", "this", "that", "it",
    "i", "we", "you", "he", "she", "they", "please", "add", "new",
]);
export function extractKeywords(input, limit = 8) {
    const tokens = input
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/\s+/)
        .filter((t) => t.length > 2 && !STOPWORDS.has(t));
    const seen = new Set();
    const out = [];
    for (const token of tokens) {
        if (seen.has(token))
            continue;
        seen.add(token);
        out.push(token);
        if (out.length >= limit)
            break;
    }
    return out;
}
export function parseTokens(input) {
    var _a, _b;
    const raw = normalize(input);
    const amount = extractAmount(raw);
    return {
        email: extractEmail(raw),
        phone: extractPhone(raw),
        amount: (_a = amount === null || amount === void 0 ? void 0 : amount.value) !== null && _a !== void 0 ? _a : null,
        amountRaw: (_b = amount === null || amount === void 0 ? void 0 : amount.raw) !== null && _b !== void 0 ? _b : null,
        id: extractId(raw),
        date: extractDate(raw),
        time: extractTime(raw),
        name: extractName(raw),
        keywords: extractKeywords(raw),
        raw,
    };
}
export function hasKeyword(input, keywords) {
    const lowered = input.toLowerCase();
    return keywords.some((kw) => lowered.includes(kw.toLowerCase()));
}
