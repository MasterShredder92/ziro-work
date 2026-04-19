export type AgentOSEventLevel = "info" | "success" | "warning" | "error";

export type AgentOSEventRecord = {
  id: string;
  at: number;
  agentId: string;
  actionId: string;
  label: string;
  level: AgentOSEventLevel;
  detail?: string;
  pathname?: string;
};

const STORAGE_KEY = "ziro:agentOS:eventLog";
const MAX_STORED = 120;

function isRecord(value: unknown): value is AgentOSEventRecord {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<AgentOSEventRecord>;
  return (
    typeof row.id === "string" &&
    typeof row.at === "number" &&
    typeof row.agentId === "string" &&
    typeof row.actionId === "string" &&
    typeof row.label === "string" &&
    (row.level === "info" || row.level === "success" || row.level === "warning" || row.level === "error")
  );
}

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function loadAgentOSEventLog(): AgentOSEventRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecord).sort((a, b) => b.at - a.at).slice(0, MAX_STORED);
  } catch {
    return [];
  }
}

export function saveAgentOSEventLog(rows: AgentOSEventRecord[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.slice(0, MAX_STORED)));
  } catch {
    /* ignore storage errors */
  }
}

export function appendAgentOSEvent(
  prev: AgentOSEventRecord[],
  entry: Omit<AgentOSEventRecord, "id" | "at"> & { at?: number },
): AgentOSEventRecord[] {
  const next: AgentOSEventRecord = {
    ...entry,
    id: makeId(),
    at: entry.at ?? Date.now(),
  };
  return [next, ...prev].slice(0, MAX_STORED);
}
