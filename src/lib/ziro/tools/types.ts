export type ToolInput = {
  raw: string;
  args?: Record<string, unknown> | null;
  tenantId: string;
  profileId: string;
  conversationId: string;
};

export type ToolOutput = {
  result: unknown;
  metadata?: Record<string, unknown>;
};

export type ToolHandler = (input: ToolInput) => Promise<ToolOutput>;

export type ToolDefinition = {
  name: string;
  description: string;
  handler: ToolHandler;
};

export type ToolPack = Record<string, ToolDefinition>;

export type ValidationResult<T> = {
  args: T;
  errors: string[];
};
