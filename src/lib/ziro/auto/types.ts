export type AutoActionContext = {
  tenantId: string;
  profileId: string | null;
  now: Date;
};

export type AutoActionDetails = Record<string, unknown>;

export type AutoActionResult = {
  triggered: boolean;
  details?: AutoActionDetails;
};

export type AutoActionHandler = (
  ctx: AutoActionContext,
) => Promise<AutoActionResult>;

export type AutoActionDefinition = {
  key: string;
  description: string;
  handler: AutoActionHandler;
};

export type AutoActionPack = {
  key: string;
  description: string;
  actions: AutoActionDefinition[];
};

export type AutoActionRunRecord = {
  pack: string;
  key: string;
  triggered: boolean;
  details?: AutoActionDetails;
  error?: string;
  startedAt: string;
  endedAt: string;
  durationMs: number;
};

export type AutoActionRunSummary = {
  tenantId: string;
  profileId: string | null;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  results: AutoActionRunRecord[];
};
