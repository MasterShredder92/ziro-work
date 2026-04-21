function toClassName(value) {
    if (!value)
        return "";
    if (typeof value === "string" || typeof value === "number")
        return String(value);
    if (Array.isArray(value))
        return value.map(toClassName).filter(Boolean).join(" ");
    if (typeof value === "object") {
        return Object.entries(value)
            .filter(([, v]) => Boolean(v))
            .map(([k]) => k)
            .join(" ");
    }
    return "";
}
export function cn(...values) {
    return values.map(toClassName).filter(Boolean).join(" ");
}
