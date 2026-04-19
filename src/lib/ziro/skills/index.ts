import { star } from "./star";
import { ruby } from "./ruby";
import { bub } from "./bub";
import { stewie } from "./stewie";
import { vader } from "./vader";
import { ziro } from "./ziro";
import type {
  SkillDefinition,
  SkillHandlerInput,
  SkillHandlerOutput,
  SkillPack,
} from "./types";

export const skillPacks = {
  star,
  ruby,
  bub,
  stewie,
  vader,
  ziro,
} as const;

export type SkillPackMap = typeof skillPacks;
export type SkillPackAgentSlug = keyof SkillPackMap;

export function listSkillPackAgents(): SkillPackAgentSlug[] {
  return Object.keys(skillPacks) as SkillPackAgentSlug[];
}

export function getSkillPack(agentSlug: string): SkillPack | null {
  const pack = (skillPacks as Record<string, SkillPack>)[agentSlug];
  return pack ?? null;
}

export function getSkillPackSkill(
  agentSlug: string,
  skillKey: string,
): SkillDefinition | null {
  const pack = getSkillPack(agentSlug);
  if (!pack) return null;
  return pack[skillKey] ?? null;
}

export type SkillPackSkillEntry = {
  agentSlug: SkillPackAgentSlug;
  skillKey: string;
  skill: SkillDefinition;
};

export function listSkillPackSkills(): SkillPackSkillEntry[] {
  const out: SkillPackSkillEntry[] = [];
  for (const agentSlug of Object.keys(skillPacks) as SkillPackAgentSlug[]) {
    const pack = skillPacks[agentSlug] as SkillPack;
    for (const skillKey of Object.keys(pack)) {
      out.push({ agentSlug, skillKey, skill: pack[skillKey] });
    }
  }
  return out;
}

export type SkillPackMatch = {
  agent: SkillPackAgentSlug;
  key: string;
  definition: SkillDefinition;
};

const KEY_SPLIT_RE = /^([a-z0-9_-]+)[./:]([A-Za-z0-9_-]+)$/;

export function findSkillInPacks(slugOrKey: string): SkillPackMatch | null {
  if (!slugOrKey) return null;
  const normalized = slugOrKey.trim();
  if (normalized.length === 0) return null;

  const scoped = KEY_SPLIT_RE.exec(normalized);
  if (scoped) {
    const agent = scoped[1].toLowerCase() as SkillPackAgentSlug;
    const key = scoped[2];
    const pack = skillPacks[agent] as SkillPack | undefined;
    if (pack && pack[key]) return { agent, key, definition: pack[key] };
  }

  for (const agent of Object.keys(skillPacks) as SkillPackAgentSlug[]) {
    const pack = skillPacks[agent] as SkillPack;
    if (pack[normalized]) {
      return { agent, key: normalized, definition: pack[normalized] };
    }
  }

  return null;
}

export function resolveSkillPackSkill(identifier: string): {
  agentSlug: SkillPackAgentSlug;
  skillKey: string;
  skill: SkillDefinition;
} | null {
  const hit = findSkillInPacks(identifier);
  if (!hit) return null;
  return { agentSlug: hit.agent, skillKey: hit.key, skill: hit.definition };
}

export async function runSkillPackSkill(
  identifier: string,
  args: SkillHandlerInput,
): Promise<SkillHandlerOutput> {
  const resolved = resolveSkillPackSkill(identifier);
  if (!resolved) {
    throw new Error(`runSkillPackSkill: no skill pack entry for '${identifier}'`);
  }
  return resolved.skill.handler(args);
}

export { star, ruby, bub, stewie, vader, ziro };
export type {
  SkillDefinition,
  SkillHandlerInput,
  SkillHandlerOutput,
  SkillPack,
} from "./types";
export type SkillPackSkill = SkillDefinition;
export type SkillPackHandlerArgs = SkillHandlerInput;
