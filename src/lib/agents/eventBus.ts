type EventHandler = (payload: unknown) => void;

const listeners: Map<string, Set<EventHandler>> = new Map();

export function subscribe(eventName: string, handler: EventHandler) {
  let set = listeners.get(eventName);
  if (!set) {
    set = new Set();
    listeners.set(eventName, set);
  }
  set.add(handler);
}

export function publish(eventName: string, payload: unknown) {
  const set = listeners.get(eventName);
  if (!set) return;
  for (const handler of set) {
    handler(payload);
  }
}

// Back-compat: some modules expect an `emit()` API.
export function emit(eventName: string, payload: unknown) {
  publish(eventName, payload);
}

export function unsubscribe(eventName: string, handler: EventHandler) {
  const set = listeners.get(eventName);
  if (!set) return;
  set.delete(handler);
  if (set.size === 0) listeners.delete(eventName);
}

const eventBus = { subscribe, publish, unsubscribe, emit };
export default eventBus;

