/**
 * Structured JSON logger. Safe for serverless/edge. No external deps.
 * All logs are emitted to stdout/stderr as single-line JSON with a
 * stable schema so they can be parsed by any log drain (Vercel, Datadog, etc).
 */
const LEVELS = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
};
function envLevel() {
    var _a;
    const raw = ((_a = process.env.ZIRO_LOG_LEVEL) !== null && _a !== void 0 ? _a : "info").toLowerCase();
    if (raw in LEVELS)
        return LEVELS[raw];
    return LEVELS.info;
}
function safeStringify(value) {
    try {
        return JSON.stringify(value, (_key, v) => {
            if (v instanceof Error) {
                return {
                    name: v.name,
                    message: v.message,
                    stack: v.stack,
                };
            }
            if (typeof v === "bigint")
                return v.toString();
            return v;
        });
    }
    catch (_a) {
        try {
            return JSON.stringify({ unserializable: String(value) });
        }
        catch (_b) {
            return '{"unserializable":true}';
        }
    }
}
function emit(level, message, fields, context) {
    if (LEVELS[level] < envLevel())
        return;
    const payload = Object.assign(Object.assign({ ts: new Date().toISOString(), level,
        message }, context), fields);
    const line = safeStringify(payload);
    if (level === "error" || level === "warn") {
        console.error(line);
    }
    else {
        console.log(line);
    }
}
export function createLogger(context = {}) {
    return {
        debug(message, fields = {}) {
            emit("debug", message, fields, context);
        },
        info(message, fields = {}) {
            emit("info", message, fields, context);
        },
        warn(message, fields = {}) {
            emit("warn", message, fields, context);
        },
        error(message, fields = {}) {
            emit("error", message, fields, context);
        },
        child(extra) {
            return createLogger(Object.assign(Object.assign({}, context), extra));
        },
    };
}
export const logger = createLogger({ subsystem: "app" });
