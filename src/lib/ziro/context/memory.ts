export type MemoryValue =
  | string
  | number
  | boolean
  | null
  | MemoryValue[]
  | { [key: string]: MemoryValue };

export type Memory = Record<string, MemoryValue>;

type GlobalWithMemory = typeof globalThis & {
  __ziroAgentMemory?: Map<string, Memory>;
};

function store(): Map<string, Memory> {
  const g = globalThis as GlobalWithMemory;
  if (!g.__ziroAgentMemory) {
    g.__ziroAgentMemory = new Map<string, Memory>();
  }
  return g.__ziroAgentMemory;
}

function ensureSerializable(value: unknown): MemoryValue {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) {
    throw new Error("appendMemory: value is not JSON-serializable");
  }
  return JSON.parse(serialized) as MemoryValue;
}

function normalizeKey(id: string | null | undefined): string | null {
  if (typeof id !== "string") return null;
  const trimmed = id.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getMemory(conversationId: string | null | undefined): Memory {
  const key = normalizeKey(conversationId);
  if (!key) return {};
  const existing = store().get(key);
  if (!existing) return {};
  return JSON.parse(JSON.stringify(existing)) as Memory;
}

export function appendMemory(
  conversationId: string | null | undefined,
  key: string,
  value: unknown,
): Memory {
  const conv = normalizeKey(conversationId);
  if (!conv) {
    throw new Error("appendMemory: conversationId is required");
  }
  if (typeof key !== "string" || key.trim().length === 0) {
    throw new Error("appendMemory: key is required");
  }
  const safe = ensureSerializable(value);
  const map = store();
  const current = map.get(conv) ?? {};
  const next: Memory = { ...current, [key]: safe };
  map.set(conv, next);
  return JSON.parse(JSON.stringify(next)) as Memory;
}

export function clearMemory(conversationId: string | null | undefined): void {
  const key = normalizeKey(conversationId);
  if (!key) return;
  store().delete(key);
}

export function listMemoryKeys(): string[] {
  return Array.from(store().keys());
}
