export type AgentMetadata = {
  id: string;
  displayName: string;
  imagePath: string;
  name: string;
  avatar: string;
  accent: string;
  glow: string;
  tagline: string;
};

function makeMeta(
  id: string,
  displayName: string,
  accent: string,
  glow: string,
  tagline: string,
): AgentMetadata {
  return {
    id,
    displayName,
    imagePath: `/static/agents/${id}.png`,
    name: displayName,
    avatar: `${id}.png`,
    accent,
    glow,
    tagline,
  };
}

export const AGENT_METADATA: Record<string, AgentMetadata> = {
  star: makeMeta(
    "star",
    "STAR",
    "#a78bfa",
    "rgba(167, 139, 250, 0.45)",
    "Tells you what to do first with leads and new students.",
  ),
  ziro: makeMeta(
    "ziro",
    "Ziro",
    "#00ff88",
    "rgba(0, 255, 136, 0.45)",
    'Answers "what does this button do?" in normal words.',
  ),
  sid: makeMeta(
    "sid",
    "Sid",
    "#38bdf8",
    "rgba(56, 189, 248, 0.45)",
    "Points at students who might leave so you can save them.",
  ),
  stewie: makeMeta(
    "stewie",
    "Stewie",
    "#f472b6",
    "rgba(244, 114, 182, 0.45)",
    "Reminds you who still needs a follow-up or next step.",
  ),
  vader: makeMeta(
    "vader",
    "Vader",
    "#f87171",
    "rgba(248, 113, 113, 0.45)",
    "Helps you message families and teachers without digging everywhere.",
  ),
  bub: makeMeta(
    "bub",
    "Bub",
    "#facc15",
    "rgba(250, 204, 21, 0.45)",
    "Shows money in, money out, and who still needs to pay.",
  ),
  ruby: makeMeta(
    "ruby",
    "Ruby",
    "#fb923c",
    "rgba(251, 146, 60, 0.45)",
    "Helps with the calendar: open times and schedule clashes.",
  ),
};

export function getAgentMetadata(id: string): AgentMetadata | null {
  return AGENT_METADATA[id] ?? null;
}

export function listAgentMetadata(): AgentMetadata[] {
  return Object.values(AGENT_METADATA);
}

export function getAgentImagePath(id: string): string | null {
  const meta = AGENT_METADATA[id];
  if (!meta) return null;
  return meta.imagePath;
}
