export type RuntimeContext = {
  lastAgentId: string | null;
  lastActionId: string | null;
  lastEventName: string | null;
  lastResult: unknown | null;
};

let ctx: RuntimeContext | null = null;

/**
 * Initialize (or reset) the shared runtime context.
 * Returns the singleton context object.
 */
export function createRuntimeContext(): RuntimeContext {
  ctx = {
    lastAgentId: null,
    lastActionId: null,
    lastEventName: null,
    lastResult: null,
  };
  return ctx;
}

/**
 * Get the shared runtime context singleton.
 * If it hasn't been created yet, it will be initialized with nulls.
 */
export function getRuntimeContext(): RuntimeContext {
  if (!ctx) return createRuntimeContext();
  return ctx;
}
