import "server-only";
// automation removed — no handlers to register until agents are rebuilt

let registered = false;

export function ensureQueueHandlersRegistered(): void {
  if (registered) return;
  // no-op until automation agents are rebuilt
  registered = true;
}
