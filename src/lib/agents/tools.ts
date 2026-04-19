import { AgentContext, ToolDefinition } from "./types";

const tools: Record<string, ToolDefinition> = {};

export function registerTool(tool: ToolDefinition) {
  tools[tool.name] = tool;
}

export function getTool(name: string): ToolDefinition | undefined {
  return tools[name];
}

export async function runTool(name: string, args: unknown, ctx: AgentContext) {
  const tool = tools[name];
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool.run(args, ctx);
}

