import type { Runtime } from "@/types/orchestrator";

// Runtime executor interface — each runtime implements this
export interface RuntimeExecutor {
  canExecute: (runtime: Runtime) => boolean;
  execute: (prompt: string, taskId: string) => Promise<RuntimeResult>;
}

export interface RuntimeResult {
  success: boolean;
  output: string;
  durationMs: number;
}

// ── claude_code runtime (fully implemented — delegates to existing worker) ──
// The existing lessonpreneur-worker.js handles claude_code execution.
// This module provides the routing logic; the worker picks up tasks from agent_tasks.

export function isClaudeCodeRuntime(runtime: Runtime): boolean {
  return runtime === "claude_code";
}

// ── browser runtime (stub) ──
export function isBrowserRuntime(runtime: Runtime): boolean {
  return runtime === "browser";
}

export async function executeBrowserTask(
  _prompt: string,
  _taskId: string
): Promise<RuntimeResult> {
  console.log(`[RUNTIME] Browser runtime not yet implemented`);
  return {
    success: false,
    output: "Browser runtime is not yet implemented. Task requires manual execution.",
    durationMs: 0,
  };
}

// ── api runtime (stub) ──
export function isApiRuntime(runtime: Runtime): boolean {
  return runtime === "api";
}

export async function executeApiTask(
  _prompt: string,
  _taskId: string
): Promise<RuntimeResult> {
  console.log(`[RUNTIME] API runtime not yet implemented`);
  return {
    success: false,
    output: "API runtime is not yet implemented. Task requires manual execution.",
    durationMs: 0,
  };
}

// ── manual runtime (stub) ──
export function isManualRuntime(runtime: Runtime): boolean {
  return runtime === "manual";
}

export async function executeManualTask(
  _prompt: string,
  _taskId: string
): Promise<RuntimeResult> {
  console.log(`[RUNTIME] Manual runtime — requires human action`);
  return {
    success: false,
    output: "This task requires manual human execution. No automated runtime available.",
    durationMs: 0,
  };
}

// ── Select and validate runtime ──
export function validateRuntime(runtime: string): Runtime {
  const valid: Runtime[] = ["claude_code", "browser", "api", "manual"];
  if (valid.includes(runtime as Runtime)) {
    return runtime as Runtime;
  }
  console.warn(`[RUNTIME] Unknown runtime "${runtime}", defaulting to claude_code`);
  return "claude_code";
}
