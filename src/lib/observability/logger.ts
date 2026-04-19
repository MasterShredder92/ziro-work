/**
 * Structured JSON logger. Safe for serverless/edge. No external deps.
 * All logs are emitted to stdout/stderr as single-line JSON with a
 * stable schema so they can be parsed by any log drain (Vercel, Datadog, etc).
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogFields = Record<string, unknown>;

export interface LogContext {
  requestId?: string;
  tenantId?: string;
  userId?: string;
  route?: string;
  subsystem?: string;
}

const LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function envLevel(): number {
  const raw = (process.env.ZIRO_LOG_LEVEL ?? "info").toLowerCase();
  if (raw in LEVELS) return LEVELS[raw as LogLevel];
  return LEVELS.info;
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, (_key, v) => {
      if (v instanceof Error) {
        return {
          name: v.name,
          message: v.message,
          stack: v.stack,
        };
      }
      if (typeof v === "bigint") return v.toString();
      return v;
    });
  } catch {
    try {
      return JSON.stringify({ unserializable: String(value) });
    } catch {
      return '{"unserializable":true}';
    }
  }
}

function emit(level: LogLevel, message: string, fields: LogFields, context: LogContext): void {
  if (LEVELS[level] < envLevel()) return;
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...context,
    ...fields,
  };
  const line = safeStringify(payload);
  if (level === "error" || level === "warn") {
    console.error(line);
  } else {
    console.log(line);
  }
}

export interface Logger {
  debug(message: string, fields?: LogFields): void;
  info(message: string, fields?: LogFields): void;
  warn(message: string, fields?: LogFields): void;
  error(message: string, fields?: LogFields): void;
  child(context: LogContext): Logger;
}

export function createLogger(context: LogContext = {}): Logger {
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
      return createLogger({ ...context, ...extra });
    },
  };
}

export const logger = createLogger({ subsystem: "app" });
