import { getServiceClient } from "@/lib/supabase";
/**
 * Create a task thread when a task begins execution.
 * Returns the thread ID for subsequent message logging.
 */
export async function createTaskThread(taskId, agentId, threadTitle) {
    const supabase = getServiceClient();
    const { data, error } = await supabase
        .from("task_threads")
        .insert({
        task_id: taskId,
        agent_id: agentId,
        thread_title: threadTitle,
        status: "open",
    })
        .select("id")
        .single();
    if (error) {
        console.error(`[THREAD] Failed to create thread for task ${taskId}: ${error.message}`);
        return null;
    }
    // Link thread to agent_tasks
    await supabase
        .from("agent_tasks")
        .update({ thread_id: data.id })
        .eq("id", taskId);
    console.log(`[THREAD] Created thread ${data.id} for task ${taskId}`);
    return data.id;
}
/**
 * Append a message to a task thread.
 */
export async function appendTaskMessage(threadId, senderType, senderName, messageType, content, metadata) {
    const supabase = getServiceClient();
    const { data, error } = await supabase
        .from("task_messages")
        .insert({
        thread_id: threadId,
        sender_type: senderType,
        sender_name: senderName,
        message_type: messageType,
        content,
        metadata: metadata || {},
    })
        .select("id")
        .single();
    if (error) {
        console.error(`[THREAD] Failed to append message to thread ${threadId}: ${error.message}`);
        return null;
    }
    return data.id;
}
/**
 * Close a task thread after completion.
 */
export async function closeTaskThread(threadId, summary) {
    const supabase = getServiceClient();
    await supabase
        .from("task_threads")
        .update({
        status: "closed",
        ended_at: new Date().toISOString(),
        summary,
    })
        .eq("id", threadId);
}
