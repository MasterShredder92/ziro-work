import type { ToolDefinition, ToolPack } from "./types";
import {
  createLeadTool,
  mergeLeadTool,
  qualifyLeadTool,
  tagLeadTool,
} from "./starTools";
import {
  createBlockTool,
  detectConflictsTool,
  suggestScheduleTool,
} from "./rubyTools";
import {
  createInvoiceTool,
  recordPaymentTool,
  reconcileSquareTool,
} from "./bubTools";
import {
  createFollowupTool,
  listFollowupsTool,
  summarizeFollowupsTool,
} from "./stewieTools";
import {
  sendFamilyMessageTool,
  sendStudentMessageTool,
  sendTeacherMessageTool,
} from "./vaderTools";

function pack(defs: ToolDefinition[]): ToolPack {
  const out: ToolPack = {};
  for (const def of defs) out[def.name] = def;
  return out;
}

export const starPack: ToolPack = pack([
  createLeadTool,
  qualifyLeadTool,
  mergeLeadTool,
  tagLeadTool,
]);

export const rubyPack: ToolPack = pack([
  createBlockTool,
  detectConflictsTool,
  suggestScheduleTool,
]);

export const bubPack: ToolPack = pack([
  createInvoiceTool,
  recordPaymentTool,
  reconcileSquareTool,
]);

export const stewiePack: ToolPack = pack([
  createFollowupTool,
  listFollowupsTool,
  summarizeFollowupsTool,
]);

export const vaderPack: ToolPack = pack([
  sendFamilyMessageTool,
  sendTeacherMessageTool,
  sendStudentMessageTool,
]);

export const toolPacks: Record<string, ToolPack> = {
  star: starPack,
  ruby: rubyPack,
  bub: bubPack,
  stewie: stewiePack,
  vader: vaderPack,
};

export type ToolPackKey = keyof typeof toolPacks;

export function findToolInPacks(name: string): ToolDefinition | null {
  for (const agentSlug of Object.keys(toolPacks)) {
    const pack = toolPacks[agentSlug];
    if (pack[name]) return pack[name];
  }
  return null;
}

export function listAllTools(): ToolDefinition[] {
  const seen = new Set<string>();
  const out: ToolDefinition[] = [];
  for (const pack of Object.values(toolPacks)) {
    for (const def of Object.values(pack)) {
      if (seen.has(def.name)) continue;
      seen.add(def.name);
      out.push(def);
    }
  }
  return out;
}

export * from "./types";
export {
  createLeadTool,
  mergeLeadTool,
  qualifyLeadTool,
  tagLeadTool,
} from "./starTools";
export {
  createBlockTool,
  detectConflictsTool,
  suggestScheduleTool,
} from "./rubyTools";
export {
  createInvoiceTool,
  recordPaymentTool,
  reconcileSquareTool,
} from "./bubTools";
export {
  createFollowupTool,
  listFollowupsTool,
  summarizeFollowupsTool,
} from "./stewieTools";
export {
  sendFamilyMessageTool,
  sendStudentMessageTool,
  sendTeacherMessageTool,
} from "./vaderTools";
export {
  validateLeadInput,
  validateScheduleInput,
  validateInvoiceInput,
  validateMessageInput,
  validateFollowupInput,
} from "./validators";
export {
  normalizeName,
  normalizePhone,
  normalizeEmail,
  normalizeDate,
  normalizeMoney,
} from "./normalizers";
