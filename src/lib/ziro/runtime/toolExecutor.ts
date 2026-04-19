import {
  findToolInPacks,
  toolPacks,
  type ToolDefinition,
  type ToolInput,
  type ToolOutput,
} from "@/lib/ziro/tools";

type GlobalWithRegistry = typeof globalThis & {
  __ziro_runtime_tool_registry?: Map<string, ToolDefinition>;
};

const g = globalThis as GlobalWithRegistry;

function getRegistry(): Map<string, ToolDefinition> {
  if (!g.__ziro_runtime_tool_registry)
    g.__ziro_runtime_tool_registry = new Map<string, ToolDefinition>();
  return g.__ziro_runtime_tool_registry;
}

export function registerTool(definition: ToolDefinition): void {
  if (!definition?.name) throw new Error("registerTool: name is required");
  if (typeof definition.handler !== "function")
    throw new Error("registerTool: handler must be a function");
  getRegistry().set(definition.name, definition);
}

export function unregisterTool(name: string): void {
  getRegistry().delete(name);
}

export function hasTool(name: string): boolean {
  if (getRegistry().has(name)) return true;
  return !!findToolInPacks(name);
}

export function resolveTool(name: string): ToolDefinition | null {
  const packTool = findToolInPacks(name);
  if (packTool) return packTool;
  return getRegistry().get(name) ?? null;
}

export function listRegisteredTools(): ToolDefinition[] {
  const reg = Array.from(getRegistry().values());
  const packDefs = Object.values(toolPacks).flatMap((p) => Object.values(p));
  const seen = new Set<string>();
  const out: ToolDefinition[] = [];
  for (const def of [...packDefs, ...reg]) {
    if (seen.has(def.name)) continue;
    seen.add(def.name);
    out.push(def);
  }
  return out;
}

export type ExecuteToolResult =
  | { ok: true; output: ToolOutput }
  | {
      ok: false;
      error: { message: string; name: string | null; stack: string | null };
    };

export async function executeTool(
  name: string,
  input: ToolInput,
): Promise<ToolOutput> {
  const tool = resolveTool(name);
  if (!tool) throw new Error(`Unknown tool: ${name}`);
  return tool.handler(input);
}

export async function safeExecuteTool(
  name: string,
  input: ToolInput,
): Promise<ExecuteToolResult> {
  try {
    const output = await executeTool(name, input);
    return { ok: true, output };
  } catch (error) {
    if (error instanceof Error) {
      return {
        ok: false,
        error: {
          message: error.message,
          name: error.name ?? null,
          stack: error.stack ?? null,
        },
      };
    }
    return {
      ok: false,
      error: {
        message: typeof error === "string" ? error : JSON.stringify(error),
        name: null,
        stack: null,
      },
    };
  }
}
