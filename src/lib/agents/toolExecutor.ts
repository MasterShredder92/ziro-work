type ToolFn = (args: unknown) => Promise<unknown>;

const tools: Record<string, ToolFn> = {};

export function registerTool(name: string, fn: ToolFn): void {
  tools[name] = fn;
}

export async function executeTool(toolName: string, args: unknown): Promise<unknown> {
  const tool = tools[toolName];
  if (!tool) {
    throw new Error("Unknown tool: " + toolName);
  }
  return await tool(args);
}

