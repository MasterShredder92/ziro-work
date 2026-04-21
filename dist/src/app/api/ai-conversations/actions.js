"use server";
import { revalidatePath } from "next/cache";
import { appendAIMessage, createAIConversation, deleteAIConversation, getAIConversationById, listAIConversations, listAIMessages, updateAIConversation, } from "@data/aiConversations";
import { assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
export async function listAIConversationsAction(tenantId, filter) {
    await assertTenantAccess(tenantId);
    return listAIConversations(tenantId, filter);
}
export async function getAIConversationAction(tenantId, id) {
    await assertTenantAccess(tenantId);
    return getAIConversationById(id, tenantId);
}
export async function createAIConversationAction(tenantId, input) {
    await assertTenantAccess(tenantId);
    await logAudit("ai_conversations.create", { tenantId, input });
    const row = await createAIConversation(tenantId, input);
    revalidatePath("/ai-inbox");
    return row;
}
export async function updateAIConversationAction(tenantId, id, input) {
    await assertTenantAccess(tenantId);
    await logAudit("ai_conversations.update", { tenantId, id, input });
    const row = await updateAIConversation(id, tenantId, input);
    revalidatePath("/ai-inbox");
    revalidatePath(`/ai-inbox/${id}`);
    return row;
}
export async function deleteAIConversationAction(tenantId, id) {
    await assertTenantAccess(tenantId);
    await logAudit("ai_conversations.delete", { tenantId, id });
    await deleteAIConversation(id, tenantId);
    revalidatePath("/ai-inbox");
}
export async function listAIMessagesAction(tenantId, conversationId) {
    await assertTenantAccess(tenantId);
    return listAIMessages(conversationId, tenantId);
}
export async function appendAIMessageAction(tenantId, input) {
    await assertTenantAccess(tenantId);
    await logAudit("ai_messages.append", {
        tenantId,
        conversationId: input.conversation_id,
    });
    const row = await appendAIMessage(tenantId, input);
    revalidatePath(`/ai-inbox/${input.conversation_id}`);
    return row;
}
