export type SkillHandlerInput = {
  input?: string;
  tenantId: string;
  profileId: string;
  conversationId: string;
};

export type SkillHandlerOutput = {
  result: unknown;
  toolCalls?: unknown[];
  metadata?: unknown;
};

export type SkillDefinition = {
  title: string;
  description: string;
  handler: (args: SkillHandlerInput) => Promise<SkillHandlerOutput>;
};

export type SkillPack = Record<string, SkillDefinition>;

export type SkillPackSkill = SkillDefinition;
export type SkillPackHandlerArgs = SkillHandlerInput;
