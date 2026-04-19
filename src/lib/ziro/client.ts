import {
  getAgentById,
  getAgentByName,
  listAgents,
  resolveAgent,
  touchAgentUsage,
} from "./agentRegistry";
import {
  attachSkillToAgent,
  detachSkillFromAgent,
  getSkillById,
  getSkillByKey,
  listSkills,
  listSkillsForAgent,
  resolveSkill,
  touchSkillUsage,
} from "./skillRegistry";
import {
  deleteBinding,
  getBinding,
  listBindings,
  pageKeyFromPath,
  resolvePageBindings,
  upsertBinding,
} from "./pageIntelligence";
import { logAction, runTurn, type ConversationTurnInput, type ConversationTurnResult } from "./conversationPipeline";

export const ziro = {
  agents: {
    list: listAgents,
    get: getAgentById,
    byName: getAgentByName,
    resolve: resolveAgent,
    touch: touchAgentUsage,
  },
  skills: {
    list: listSkills,
    get: getSkillById,
    byKey: getSkillByKey,
    resolve: resolveSkill,
    forAgent: listSkillsForAgent,
    attach: attachSkillToAgent,
    detach: detachSkillFromAgent,
    touch: touchSkillUsage,
  },
  pages: {
    list: listBindings,
    get: getBinding,
    upsert: upsertBinding,
    delete: deleteBinding,
    resolve: resolvePageBindings,
    keyFromPath: pageKeyFromPath,
  },
  run(input: ConversationTurnInput): Promise<ConversationTurnResult> {
    return runTurn(input);
  },
  logAction,
};

export type ZiroClient = typeof ziro;
