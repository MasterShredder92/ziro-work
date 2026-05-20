import type {
  AIConversation,
  AIConversationInsert,
  AIConversationUpdate,
  AIMessage,
  AIMessageInsert,
} from "@/lib/types/entities";
import { clientFor, applyListOptions, type ListOptions } from "./_client";

const CONVERSATIONS = "ai_conversations";
const MESSAGES = "ai_messages";

export type AIConversationFilter = {
  profile_id?: string;
  source?: string;
  client_route?: string;
};

export async function listAIConversations(
  tenantId: string,
  filter?: AIConversationFilter,
  opts?: ListOptions,
): Promise<AIConversation[]> {
  const supabase = await clientFor(tenantId);
  let query = supabase
    .from(CONVERSATIONS)
    .select("*")
    .eq("tenant_id", tenantId);

  if (filter?.profile_id) query = query.eq("profile_id", filter.profile_id);
  if (filter?.source) query = query.eq("source", filter.source);
  if (filter?.client_route) query = query.eq("client_route", filter.client_route);

  const ordered = applyListOptions(query, {
    orderBy: opts?.orderBy ?? "updated_at",
    ascending: opts?.ascending ?? false,
    limit: opts?.limit ?? 50,
    offset: opts?.offset,
  });

  const { data, error } = await ordered;
  if (error) throw error;
  return (data ?? []) as AIConversation[];
}

export async function getAIConversationById(
  id: string,
  tenantId: string,
): Promise<AIConversation | null> {
  const supabase = await clientFor(tenantId);
  const { data, error } = await supabase
    .from(CONVERSATIONS)
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as AIConversation | null;
}

export async function createAIConversation(
  tenantId: string,
  input: Omit<AIConversationInsert, "tenant_id">,
): Promise<AIConversation> {
  const supabase = await clientFor(tenantId);
  const { data, error } = await supabase
    .from(CONVERSATIONS)
    .insert({ ...input, tenant_id: tenantId })
    .select("*")
    .single();
  if (error) throw error;
  return data as AIConversation;
}

export async function updateAIConversation(
  id: string,
  tenantId: string,
  input: AIConversationUpdate,
): Promise<AIConversation> {
  const supabase = await clientFor(tenantId);
  const patch = { ...input, updated_at: new Date().toISOString() };
  const { data, error } = await supabase
    .from(CONVERSATIONS)
    .update(patch)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as AIConversation;
}

export async function touchAIConversation(
  id: string,
  tenantId: string,
): Promise<void> {
  const supabase = await clientFor(tenantId);
  const { error } = await supabase
    .from(CONVERSATIONS)
    .update({ updated_at: new Date().toISOString() })
    .eq("tenant_id", tenantId)
    .eq("id", id);
  if (error) throw error;
}

export async function listAIMessages(
  conversationId: string,
  tenantId: string,
  opts?: ListOptions,
): Promise<AIMessage[]> {
  const supabase = await clientFor(tenantId);
  const query = supabase
    .from(MESSAGES)
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("conversation_id", conversationId)
    .order("seq", { ascending: opts?.ascending ?? true })
    .limit(opts?.limit ?? 500);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as AIMessage[];
}

export async function createAIMessage(
  tenantId: string,
  input: Omit<AIMessageInsert, "tenant_id" | "seq"> & { seq?: number },
): Promise<AIMessage> {
  return appendAIMessage(tenantId, input);
}

export async function appendAIMessage(
  tenantId: string,
  input: Omit<AIMessageInsert, "tenant_id" | "seq"> & { seq?: number },
): Promise<AIMessage> {
  const supabase = await clientFor(tenantId);

  let seq = input.seq;
  if (typeof seq !== "number") {
    const { data: last } = await supabase
      .from(MESSAGES)
      .select("seq")
      .eq("tenant_id", tenantId)
      .eq("conversation_id", input.conversation_id)
      .order("seq", { ascending: false })
      .limit(1)
      .maybeSingle();
    seq = ((last?.seq as number | undefined) ?? 0) + 1;
  }

  const { data, error } = await supabase
    .from(MESSAGES)
    .insert({ ...input, seq, tenant_id: tenantId })
    .select("*")
    .single();
  if (error) throw error;

  await touchAIConversation(input.conversation_id, tenantId);
  return data as AIMessage;
}

export async function deleteAIConversation(
  id: string,
  tenantId: string,
): Promise<void> {
  const supabase = await clientFor(tenantId);
  await supabase
    .from(MESSAGES)
    .delete()
    .eq("tenant_id", tenantId)
    .eq("conversation_id", id);
  const { error } = await supabase
    .from(CONVERSATIONS)
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", id);
  if (error) throw error;
}
