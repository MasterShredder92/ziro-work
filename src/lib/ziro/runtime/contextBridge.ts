import { getMemory, type Memory } from "@/lib/ziro/context/memory";
import {
  extractPageContext,
  type ExtractedPageContext,
  type PageSearchParams,
} from "@/lib/ziro/context/pageContext";

export type BuildTurnContextInput = {
  conversationId: string | null | undefined;
  pathname?: string | null | undefined;
  searchParams?: PageSearchParams;
};

export type TurnContext = {
  conversationId: string | null;
  timestamp: string;
  memory: Memory;
  page: ExtractedPageContext;
};

function normalizeConversationId(
  value: string | null | undefined,
): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function buildTurnContext(
  input: BuildTurnContextInput,
): Promise<TurnContext> {
  const conversationId = normalizeConversationId(input.conversationId);
  const [memory, page] = await Promise.all([
    Promise.resolve(getMemory(conversationId ?? "")),
    extractPageContext({
      pathname: input.pathname ?? null,
      searchParams: input.searchParams ?? null,
    }),
  ]);

  return {
    conversationId,
    timestamp: new Date().toISOString(),
    memory,
    page,
  };
}
