import { createLeadTool, mergeLeadTool, qualifyLeadTool, tagLeadTool, } from "./starTools";
import { createBlockTool, detectConflictsTool, suggestScheduleTool, } from "./rubyTools";
import { createInvoiceTool, recordPaymentTool, reconcileSquareTool, } from "./bubTools";
import { createFollowupTool, listFollowupsTool, summarizeFollowupsTool, } from "./stewieTools";
import { sendFamilyMessageTool, sendStudentMessageTool, sendTeacherMessageTool, } from "./vaderTools";
function pack(defs) {
    const out = {};
    for (const def of defs)
        out[def.name] = def;
    return out;
}
export const starPack = pack([
    createLeadTool,
    qualifyLeadTool,
    mergeLeadTool,
    tagLeadTool,
]);
export const rubyPack = pack([
    createBlockTool,
    detectConflictsTool,
    suggestScheduleTool,
]);
export const bubPack = pack([
    createInvoiceTool,
    recordPaymentTool,
    reconcileSquareTool,
]);
export const stewiePack = pack([
    createFollowupTool,
    listFollowupsTool,
    summarizeFollowupsTool,
]);
export const vaderPack = pack([
    sendFamilyMessageTool,
    sendTeacherMessageTool,
    sendStudentMessageTool,
]);
export const toolPacks = {
    star: starPack,
    ruby: rubyPack,
    bub: bubPack,
    stewie: stewiePack,
    vader: vaderPack,
};
export function findToolInPacks(name) {
    for (const agentSlug of Object.keys(toolPacks)) {
        const pack = toolPacks[agentSlug];
        if (pack[name])
            return pack[name];
    }
    return null;
}
export function listAllTools() {
    const seen = new Set();
    const out = [];
    for (const pack of Object.values(toolPacks)) {
        for (const def of Object.values(pack)) {
            if (seen.has(def.name))
                continue;
            seen.add(def.name);
            out.push(def);
        }
    }
    return out;
}
export * from "./types";
export { createLeadTool, mergeLeadTool, qualifyLeadTool, tagLeadTool, } from "./starTools";
export { createBlockTool, detectConflictsTool, suggestScheduleTool, } from "./rubyTools";
export { createInvoiceTool, recordPaymentTool, reconcileSquareTool, } from "./bubTools";
export { createFollowupTool, listFollowupsTool, summarizeFollowupsTool, } from "./stewieTools";
export { sendFamilyMessageTool, sendStudentMessageTool, sendTeacherMessageTool, } from "./vaderTools";
export { validateLeadInput, validateScheduleInput, validateInvoiceInput, validateMessageInput, validateFollowupInput, } from "./validators";
export { normalizeName, normalizePhone, normalizeEmail, normalizeDate, normalizeMoney, } from "./normalizers";
