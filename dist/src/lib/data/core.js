export function toErrorInfo(err) {
    if (err && typeof err === "object") {
        const anyErr = err;
        const message = typeof anyErr.message === "string"
            ? anyErr.message
            : typeof anyErr.error_description === "string"
                ? anyErr.error_description
                : "Unknown error";
        const code = typeof anyErr.code === "string" ? anyErr.code : undefined;
        return Object.assign({ message }, (code ? { code } : {}));
    }
    return { message: typeof err === "string" ? err : "Unknown error" };
}
export function toErrorInfoFromPostgrest(err) {
    return Object.assign({ message: err.message }, (err.code ? { code: err.code } : {}));
}
export function offsetRange(page, pageSize) {
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 25;
    const from = (safePage - 1) * safePageSize;
    const to = from + safePageSize - 1;
    return { page: safePage, pageSize: safePageSize, from, to };
}
export function encodeCursor(payload) {
    return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}
export function decodeCursor(cursor) {
    try {
        const raw = Buffer.from(cursor, "base64url").toString("utf8");
        return JSON.parse(raw);
    }
    catch (_a) {
        return null;
    }
}
