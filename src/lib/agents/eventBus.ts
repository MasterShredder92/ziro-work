import { AgentEvent, EventName } from "./types";

type EventHandler = (event: AgentEvent) => Promise<void>;

const listeners: Record<EventName, EventHandler[]> = {};
const subscribers: ((event: AgentEvent) => void)[] = [];

export function subscribe(eventName: EventName, handler: EventHandler) {
  if (!listeners[eventName]) listeners[eventName] = [];
  listeners[eventName].push(handler);
}

export async function emit(event: AgentEvent) {
  const handlers = listeners[event.name] || [];
  for (const handler of handlers) {
    await handler(event);
  }
}

export function sendEvent(event: AgentEvent) {
  for (const sub of subscribers) {
    sub(event);
  }
}

