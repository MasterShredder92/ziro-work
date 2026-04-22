/**
 * ZiroWork Agentic Orchestrator
 * 
 * Based on:
 * - Manus v2 Task Architecture (Ivan Leo)
 * - PaperclipAI Organizational Model
 * - Human-in-the-Loop Approval Pattern
 * 
 * This orchestrator manages the complete lifecycle of agentic tasks:
 * 1. Task Creation (via Manus v2 API)
 * 2. State Management (shared workspace)
 * 3. Tool Execution (with approval gates)
 * 4. Agent Handoffs (CEO -> Worker pattern)
 */

import { createClient } from "@supabase/supabase-js";

export interface AgentTask {
  id: string;
  agentId: string;
  status: "pending" | "processing" | "awaiting_approval" | "completed" | "failed";
  message: string;
  context: Record<string, any>;
  tools: string[];
  createdAt: Date;
  updatedAt: Date;
  manusTaskId?: string;
  approvalRequired?: boolean;
  approvalStatus?: "pending" | "approved" | "denied";
}

export interface AgentContext {
  userId: string;
  studioId: string;
  taskId: string;
  previousResults: Record<string, any>;
  tools: string[];
}

export class ZiroAgentOrchestrator {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );

  /**
   * Create a new task in the shared workspace
   * This is the entry point for all agent work
   */
  async createTask(
    agentId: string,
    message: string,
    context: Partial<AgentContext>
  ): Promise<AgentTask> {
    const task: AgentTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      status: "pending",
      message,
      context: context as Record<string, any>,
      tools: context.tools || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store in Supabase for persistence
    const { error } = await this.supabase.from("agent_tasks").insert([task]);
    if (error) {
      console.error("[Orchestrator] Failed to create task:", error);
      throw error;
    }

    return task;
  }

  /**
   * Get task by ID from the shared workspace
   */
  async getTask(taskId: string): Promise<AgentTask | null> {
    const { data, error } = await this.supabase
      .from("agent_tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    if (error) {
      console.error("[Orchestrator] Failed to get task:", error);
      return null;
    }

    return data as AgentTask;
  }

  /**
   * Update task status (e.g., from "processing" to "awaiting_approval")
   */
  async updateTaskStatus(
    taskId: string,
    status: AgentTask["status"],
    updates?: Partial<AgentTask>
  ): Promise<AgentTask | null> {
    const { data, error } = await this.supabase
      .from("agent_tasks")
      .update({
        status,
        updatedAt: new Date(),
        ...updates,
      })
      .eq("id", taskId)
      .select()
      .single();

    if (error) {
      console.error("[Orchestrator] Failed to update task:", error);
      return null;
    }

    return data as AgentTask;
  }

  /**
   * Link a Manus v2 task ID to the ZiroWork task
   * This allows us to track the agent's progress in Manus
   */
  async linkManusTask(taskId: string, manusTaskId: string): Promise<void> {
    const { error } = await this.supabase
      .from("agent_tasks")
      .update({ manusTaskId })
      .eq("id", taskId);

    if (error) {
      console.error("[Orchestrator] Failed to link Manus task:", error);
      throw error;
    }
  }

  /**
   * Request approval for a tool execution
   * This implements the Human-in-the-Loop pattern
   */
  async requestApproval(
    taskId: string,
    toolName: string,
    toolInput: Record<string, any>
  ): Promise<void> {
    const { error } = await this.supabase
      .from("agent_tasks")
      .update({
        status: "awaiting_approval",
        approvalRequired: true,
        approvalStatus: "pending",
        context: {
          pendingTool: toolName,
          pendingInput: toolInput,
        },
      })
      .eq("id", taskId);

    if (error) {
      console.error("[Orchestrator] Failed to request approval:", error);
      throw error;
    }
  }

  /**
   * Approve or deny a tool execution
   */
  async respondToApproval(
    taskId: string,
    approved: boolean
  ): Promise<void> {
    const { error } = await this.supabase
      .from("agent_tasks")
      .update({
        approvalStatus: approved ? "approved" : "denied",
        status: approved ? "processing" : "completed",
      })
      .eq("id", taskId);

    if (error) {
      console.error("[Orchestrator] Failed to respond to approval:", error);
      throw error;
    }
  }

  /**
   * Store tool execution result in the shared workspace
   * This allows other agents to access the result
   */
  async storeToolResult(
    taskId: string,
    toolName: string,
    result: any
  ): Promise<void> {
    const task = await this.getTask(taskId);
    if (!task) return;

    const updatedContext = {
      ...task.context,
      [`${toolName}_result`]: result,
    };

    const { error } = await this.supabase
      .from("agent_tasks")
      .update({ context: updatedContext })
      .eq("id", taskId);

    if (error) {
      console.error("[Orchestrator] Failed to store tool result:", error);
      throw error;
    }
  }

  /**
   * Complete a task and mark it as done
   */
  async completeTask(taskId: string, result: any): Promise<void> {
    const { error } = await this.supabase
      .from("agent_tasks")
      .update({
        status: "completed",
        context: {
          finalResult: result,
        },
      })
      .eq("id", taskId);

    if (error) {
      console.error("[Orchestrator] Failed to complete task:", error);
      throw error;
    }
  }

  /**
   * Fail a task and log the error
   */
  async failTask(taskId: string, error: string): Promise<void> {
    const { error: updateError } = await this.supabase
      .from("agent_tasks")
      .update({
        status: "failed",
        context: {
          error,
        },
      })
      .eq("id", taskId);

    if (updateError) {
      console.error("[Orchestrator] Failed to fail task:", updateError);
      throw updateError;
    }
  }
}

export const orchestrator = new ZiroAgentOrchestrator();
