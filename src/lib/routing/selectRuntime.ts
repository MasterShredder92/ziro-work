import type { Runtime } from "@/types/orchestrator";

const VALID_RUNTIMES: Runtime[] = ["claude_code", "browser", "api", "manual"];

// Runtimes that have a live worker/adapter implemented.
// Do NOT add a runtime here until its execution adapter actually works.
const IMPLEMENTED_RUNTIMES: Runtime[] = ["claude_code"];

// Select runtime: prefer classified suggestion if template supports it AND it's implemented.
// Falls back through: suggested → first supported+implemented → claude_code.
export function selectRuntime(
  suggestedRuntime: Runtime,
  supportedRuntimes: Runtime[]
): Runtime {
  // Best case: suggested runtime is both supported by template AND implemented
  if (supportedRuntimes.includes(suggestedRuntime) && IMPLEMENTED_RUNTIMES.includes(suggestedRuntime)) {
    return suggestedRuntime;
  }

  // Find first runtime that is both supported and implemented
  const viable = supportedRuntimes.find((r) => IMPLEMENTED_RUNTIMES.includes(r));
  if (viable) return viable;

  // Nothing viable — fall back to claude_code (always implemented)
  return "claude_code";
}

export function validateRuntime(runtime: string): Runtime {
  if (VALID_RUNTIMES.includes(runtime as Runtime)) {
    return runtime as Runtime;
  }
  return "claude_code";
}

// Check if a runtime has a live worker
export function isRuntimeImplemented(runtime: Runtime): boolean {
  return IMPLEMENTED_RUNTIMES.includes(runtime);
}
