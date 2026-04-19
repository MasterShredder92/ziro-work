type LogEntry = {
  level: "info" | "error";
  message: string;
  meta: unknown;
  timestamp: number;
};

const logs: LogEntry[] = [];

export function logInfo(message: string, meta?: unknown) {
  logs.push({
    level: "info",
    message,
    meta: meta ?? null,
    timestamp: Date.now(),
  });
}

export function logError(message: string, meta?: unknown) {
  logs.push({
    level: "error",
    message,
    meta: meta ?? null,
    timestamp: Date.now(),
  });
}

export function getLogs(): Array<{ level: string; message: string; meta: unknown; timestamp: number }> {
  return logs.slice();
}

export function clearLogs() {
  logs.length = 0;
}

