import { NextRequest } from "next/server";
import { anthropic } from "@/lib/anthropic";
import { getServiceClient } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { routeTask } from "@/lib/routing/routeTask";
import { isStarControlDelegation, isRouteDecision } from "@/types/orchestrator";

// Lessonpreneur Supabase client
function getLessonpreneurClient() {
  return createClient(
    process.env.LESSONPRENEUR_SUPABASE_URL!,
    process.env.LESSONPRENEUR_SERVICE_ROLE_KEY!
  );
}

// Tool definitions for STAR
const queryLessonpreneurTool: Anthropic.Tool = {
  name: "query_lessonpreneur",
  description: `Run a read-only SQL SELECT query against the Lessonpreneur Supabase database.

LESSONPRENEUR SCHEMA (tenant_id = '00000000-0000-0000-0000-000000000001' for ALL queries):
- locations: id, name, color, tenant_id, address, city, state, is_active
- students: id, first_name, last_name, email, phone, status (active/inactive), location_id, tenant_id, created_at
- profiles: id, email, role (owner/admin/studio_director/teacher/student), tenant_id
- sessions: id, student_id, teacher_id, location_id, scheduled_at, status, duration_minutes, tenant_id
- teachers: id, profile_id, location_id, tenant_id, is_active
- issues: id, title, description, status, severity, reported_by, tenant_id, created_at
- notifications: id, profile_id, tenant_id, type, title, body, read, created_at

IMPORTANT: The students_enrolled column on the locations table is STALE and INCORRECT. Real student counts must always use COUNT(s.id) with JOIN to students table grouped by location_id. Never use students_enrolled.`,
  input_schema: {
    type: "object" as const,
    properties: {
      sql: {
        type: "string",
        description:
          "A read-only SQL SELECT query. Must start with SELECT. Never use INSERT, UPDATE, DELETE, or DROP. Always include tenant_id filter.",
      },
    },
    required: ["sql"],
  },
};

const createLessonpreneurTaskTool: Anthropic.Tool = {
  name: "create_lessonpreneur_task",
  description:
    `Create a task in the agent_tasks table for the lessonpreneur worker to execute. Use this whenever the user asks you to fix, build, update, or change anything in the Lessonpreneur codebase. Write a complete, surgical Claude Code prompt as the description — include exactly what file to change, what tables are involved, what the expected behavior is, and what NOT to touch.

LESSONPRENEUR CODEBASE PATHS (HARD RULES — NO EXCEPTIONS):
- App source code: D:\\music-school-os\\app
- Run all npm commands from: D:\\music-school-os\\app
- Run all git commands from: D:\\music-school-os\\app
- Vite config, package.json, src/ folder are all inside D:\\music-school-os\\app
- NEVER reference D:\\lessonpreneur (does not exist)
- NEVER reference D:\\music-school-os without \\app (parent folder, not the app root)
- Every file path, command, and code change in the task MUST use D:\\music-school-os\\app as the working directory

Always end every task prompt with these exact steps:

FINAL STEP — COMMIT LOCALLY (DO NOT PUSH):
After all changes are complete and verified:
1. Run: git add .
2. Run: git commit -m "[brief description of what changed]"
DO NOT run git push. Stop after the commit.

When you report back what you did, always end your summary with:
'Ready to push. Tell STAR to push when you want this deployed.'

The codebase is at D:\\music-school-os\\app. Git is already configured. Just run the commands.`,
  input_schema: {
    type: "object" as const,
    properties: {
      title: {
        type: "string",
        description:
          "Short title for the task, e.g. 'CRM sort toggle + location grouping'",
      },
      description: {
        type: "string",
        description:
          "The full Claude Code prompt to execute against D:\\music-school-os\\app. Be surgical and complete. Include file paths, table names, column names, and explicit instructions not to touch unrelated code.",
      },
    },
    required: ["title", "description"],
  },
};

const pushLessonpreneurTool: Anthropic.Tool = {
  name: "push_lessonpreneur",
  description:
    "Push the latest committed changes in D:\\music-school-os\\app to GitHub, which triggers an automatic Vercel deployment. Only call this when the user explicitly says to push or deploy.",
  input_schema: {
    type: "object" as const,
    properties: {
      message: {
        type: "string",
        description: "Optional note about what is being pushed",
      },
    },
    required: [],
  },
};

async function executeLessonpreneurQuery(
  sql: string
): Promise<{ data: unknown; error: string | null }> {
  // Validate read-only
  const trimmed = sql.trim().toUpperCase();
  if (!trimmed.startsWith("SELECT")) {
    return {
      data: null,
      error:
        "Only SELECT queries are allowed. Received a query starting with: " +
        trimmed.split(/\s+/)[0],
    };
  }

  const lp = getLessonpreneurClient();

  // Try RPC first
  const { data, error } = await lp.rpc("exec_sql", { query: sql });

  if (!error) {
    return { data, error: null };
  }

  // Fallback to REST API
  try {
    const response = await fetch(
      `${process.env.LESSONPRENEUR_SUPABASE_URL}/rest/v1/rpc/exec_sql`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.LESSONPRENEUR_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.LESSONPRENEUR_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ query: sql }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return { data: null, error: `REST fallback failed (${response.status}): ${text}` };
    }

    const json = await response.json();
    return { data: json, error: null };
  } catch (fetchErr) {
    return {
      data: null,
      error: `Both RPC and REST fallback failed. RPC error: ${error.message}. Fetch error: ${String(fetchErr)}`,
    };
  }
}

// Execute a single tool_use block — returns the tool result
async function executeToolCall(
  block: Anthropic.ContentBlock,
  supabase: ReturnType<typeof getServiceClient>
): Promise<Anthropic.ToolResultBlockParam | null> {
  if (block.type !== "tool_use") return null;

  if (block.name === "query_lessonpreneur") {
    const input = block.input as { sql: string };

    try {
      console.log(`[TOOL] query_lessonpreneur executing SQL: ${input.sql.slice(0, 120)}`);
      const { data, error } = await executeLessonpreneurQuery(input.sql);

      const content = error
        ? `Error: ${error}`
        : JSON.stringify(data ?? [], null, 2).slice(0, 4000);

      console.log(`[TOOL] query_lessonpreneur result: ${content.slice(0, 120)}`);

      return {
        type: "tool_result",
        tool_use_id: block.id,
        content,
      };
    } catch (queryErr) {
      console.error(`[TOOL] query_lessonpreneur threw:`, queryErr);
      return {
        type: "tool_result",
        tool_use_id: block.id,
        content: `Error executing query: ${String(queryErr)}`,
        is_error: true,
      };
    }
  } else if (block.name === "create_lessonpreneur_task") {
    const input = block.input as { title: string; description: string };

    try {
      const routed = await routeTask(input.title, input.description);
      const classified = routed.classification;

      const { data: starAgent, error: starErr } = await supabase
        .from("agents")
        .select("id")
        .eq("slug", "star")
        .single();

      if (starErr || !starAgent) {
        return {
          type: "tool_result",
          tool_use_id: block.id,
          content: `Error: Could not find STAR agent: ${starErr?.message ?? "not found"}`,
          is_error: true,
        };
      }

      let agentId = starAgent.id;
      let taskDescription = input.description;
      let runtime = classified.suggested_runtime;
      let taskType = classified.task_type;
      let skillIds: string[] | null = null;
      let agentTemplateId: string | null = null;

      if (routed.agentId) {
        const { data: assignee } = await supabase
          .from("agents")
          .select("id, slug, zirorb_id, template_id, mode")
          .eq("id", routed.agentId)
          .maybeSingle();

        const runnableByWorker =
          assignee &&
          (assignee.slug === "star" || assignee.zirorb_id != null) &&
          assignee.mode !== "ephemeral";

        if (runnableByWorker) {
          agentId = assignee.id;
          agentTemplateId = assignee.template_id ?? null;
          if (isStarControlDelegation(routed.route)) {
            taskDescription = routed.composedPrompt;
            runtime = routed.route.runtime;
            skillIds = routed.route.skills.map((s) => s.id);
          } else if (isRouteDecision(routed.route)) {
            taskDescription = `${routed.composedPrompt}\n\n--- Operator request ---\n${input.description}`;
            runtime = routed.route.runtime;
            skillIds = routed.route.skills.map((s) => s.id);
            agentTemplateId = routed.route.template.id;
          } else {
            taskDescription = `${routed.composedPrompt}\n\n--- Operator request ---\n${input.description}`;
          }
        } else {
          console.warn(
            `[TOOL] create_lessonpreneur_task: routed agent ${routed.agentId} is not worker-runnable (need STAR or an agent in a Zirorb, non-ephemeral). Using STAR.`
          );
          taskDescription = `${routed.composedPrompt}\n\n--- Operator request ---\n${input.description}`;
        }
      } else {
        taskDescription = `${routed.composedPrompt}\n\n--- Operator request ---\n${input.description}`;
      }

      const taskInsert: Record<string, unknown> = {
        agent_id: agentId,
        title: input.title,
        description: taskDescription,
        status: "pending",
        task_type: taskType,
        runtime,
        ...(skillIds && skillIds.length > 0 ? { skill_ids: skillIds } : {}),
        ...(agentTemplateId ? { agent_template_id: agentTemplateId } : {}),
      };

      const { data: insertData, error: insertErr } = await supabase
        .from("agent_tasks")
        .insert(taskInsert)
        .select("id");

      console.log(
        `[TOOL] create_lessonpreneur_task INSERT — data: ${JSON.stringify(insertData)}, error: ${insertErr?.message ?? "none"}`
      );

      if (insertErr) {
        return {
          type: "tool_result",
          tool_use_id: block.id,
          content: `Error creating task: ${insertErr.message}`,
          is_error: true,
        };
      }

      const assigneeLabel = agentId === starAgent.id ? "STAR" : `specialist (${agentId.slice(0, 8)}…)`;
      return {
        type: "tool_result",
        tool_use_id: block.id,
        content: `Task "${input.title}" queued for ${assigneeLabel} (type: ${taskType}, runtime: ${runtime}).`,
      };
    } catch (taskErr) {
      return {
        type: "tool_result",
        tool_use_id: block.id,
        content: `Error creating task: ${String(taskErr)}`,
        is_error: true,
      };
    }
  } else if (block.name === "push_lessonpreneur") {
    try {
      const { data: starAgent, error: starErr } = await supabase
        .from("agents")
        .select("id")
        .eq("slug", "star")
        .single();

      if (starErr || !starAgent) {
        return {
          type: "tool_result",
          tool_use_id: block.id,
          content: `Error: Could not find STAR agent: ${starErr?.message ?? "not found"}`,
          is_error: true,
        };
      }

      const { data: pushData, error: insertErr } = await supabase
        .from("agent_tasks")
        .insert({
          agent_id: starAgent.id,
          title: "Git Push — Deploy to Production",
          description:
            "Run: cd D:\\music-school-os\\app && git push origin main",
          status: "pending",
          task_type: "ops",
          runtime: "claude_code",
        })
        .select("id");

      console.log(
        `[TOOL] push_lessonpreneur INSERT — data: ${JSON.stringify(pushData)}, error: ${insertErr?.message ?? "none"}`
      );

      if (insertErr) {
        return {
          type: "tool_result",
          tool_use_id: block.id,
          content: `Error queuing push task: ${insertErr.message}`,
          is_error: true,
        };
      }

      return {
        type: "tool_result",
        tool_use_id: block.id,
        content:
          "Push task has been queued. The worker will run git push origin main, which will trigger an automatic Vercel deployment.",
      };
    } catch (pushErr) {
      return {
        type: "tool_result",
        tool_use_id: block.id,
        content: `Error queuing push task: ${String(pushErr)}`,
        is_error: true,
      };
    }
  }

  return {
    type: "tool_result",
    tool_use_id: block.id,
    content: `Error: Unknown tool "${block.name}"`,
    is_error: true,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { agentId, message } = await request.json();

    if (!agentId || !message) {
      return Response.json(
        { error: "agentId and message are required" },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // Pull agent row — include slug to determine if this is STAR
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("id, slug, name, system_prompt, instructions")
      .eq("id", agentId)
      .single();

    if (agentError || !agent) {
      return Response.json({ error: "Agent not found" }, { status: 404 });
    }

    // Pull conversation history — last 20 messages (10 exchanges) to prevent context overflow
    const { data: history } = await supabase
      .from("agent_conversations")
      .select("role, content")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false })
      .limit(20);

    // Insert user message
    await supabase.from("agent_conversations").insert({
      agent_id: agentId,
      role: "user",
      content: message,
    });

    // Build messages array — history is DESC from query, reverse to ASC, then append new message
    const messages: Anthropic.MessageParam[] = [
      ...((history || []).reverse()).map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: message },
    ];

    // Only STAR gets tools
    const isStar = agent.slug === "star";
    const tools = isStar
      ? [queryLessonpreneurTool, createLessonpreneurTaskTool, pushLessonpreneurTool]
      : undefined;

    // Resolve system prompt — single source of truth per agent type:
    // STAR: reads from star_config.instructions (canonical orchestrator config)
    // Specialists: reads from agents.instructions (agent profile), falls back to system_prompt
    let systemPrompt: string;
    if (isStar) {
      const { data: starConfig } = await supabase
        .from("star_config")
        .select("instructions")
        .eq("business_context", "music_school")
        .single();
      systemPrompt = starConfig?.instructions || agent.system_prompt || `You are STAR, the central orchestrator.`;
    } else {
      systemPrompt = agent.instructions || agent.system_prompt || `You are ${agent.name}, an AI agent.`;
    }

    // Grab the abort signal from the incoming request so we stop if the client disconnects
    const signal = request.signal;

    // Return an SSE stream
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        const send = (data: object) => {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
            );
          } catch {
            // controller already closed — client disconnected
          }
        };

        try {
          let fullText = "";

          for (let iteration = 0; iteration < 10; iteration++) {
            // Bail if client disconnected
            if (signal.aborted) {
              console.log(`[LOOP] Client disconnected, aborting`);
              break;
            }

            console.log(
              `[LOOP] iteration=${iteration}, messages=${messages.length}`
            );

            // Non-streaming create so we get the full message atomically
            const response = await anthropic.messages.create({
              model: "claude-sonnet-4-20250514",
              max_tokens: 8192,
              system: systemPrompt,
              messages,
              ...(tools ? { tools } : {}),
            });

            const stopReason = response.stop_reason;
            const contentBlocks = response.content;

            console.log(
              `[LOOP] stop_reason=${stopReason}, blocks=${contentBlocks.length}, types=${contentBlocks.map((b) => b.type).join(",")}`
            );

            // ── HANDLE: end_turn ──
            if (stopReason === "end_turn") {
              // Stream all text blocks to the client
              for (const block of contentBlocks) {
                if (block.type === "text" && block.text) {
                  fullText += block.text;
                  send({ type: "text", text: block.text });
                }
              }
              console.log(`[LOOP] end_turn — final text length: ${fullText.length}`);
              break;
            }

            // ── HANDLE: max_tokens ──
            if (stopReason === "max_tokens") {
              for (const block of contentBlocks) {
                if (block.type === "text" && block.text) {
                  fullText += block.text;
                  send({ type: "text", text: block.text });
                }
              }
              send({ type: "text", text: "\n\n[Response truncated — max_tokens reached]" });
              fullText += "\n\n[Response truncated — max_tokens reached]";
              console.log(`[LOOP] max_tokens — partial text length: ${fullText.length}`);
              break;
            }

            // ── HANDLE: tool_use ──
            if (stopReason === "tool_use") {
              // Stream any text blocks that came before the tool call
              for (const block of contentBlocks) {
                if (block.type === "text" && block.text) {
                  send({ type: "text", text: block.text });
                }
              }

              // Append the full assistant response (text + tool_use blocks) to messages
              messages.push({ role: "assistant", content: contentBlocks });

              // Execute ALL tool_use blocks and collect results
              const toolResults: Anthropic.ToolResultBlockParam[] = [];

              for (const block of contentBlocks) {
                if (block.type !== "tool_use") continue;

                console.log(
                  `[TOOL] ${block.name} — id: ${block.id}, input: ${JSON.stringify(block.input).slice(0, 200)}`
                );

                let result: Anthropic.ToolResultBlockParam;

                try {
                  const executed = await executeToolCall(block, supabase);
                  if (executed) {
                    result = executed;
                  } else {
                    result = {
                      type: "tool_result",
                      tool_use_id: block.id,
                      content: `Error: executeToolCall returned null for ${block.name}`,
                      is_error: true,
                    };
                  }
                } catch (toolErr) {
                  console.error(`[TOOL] ${block.name} threw:`, toolErr);
                  result = {
                    type: "tool_result",
                    tool_use_id: block.id,
                    content: `Error: ${toolErr instanceof Error ? toolErr.message : String(toolErr)}`,
                    is_error: true,
                  };
                }

                console.log(
                  `[TOOL] ${block.name} result: ${typeof result.content === "string" ? result.content.slice(0, 150) : "non-string"}`
                );
                toolResults.push(result);
              }

              // Append tool results — Claude requires one result per tool_use
              messages.push({ role: "user", content: toolResults });

              console.log(
                `[LOOP] ${toolResults.length} tool result(s) appended. Continuing loop...`
              );

              // Reset fullText — only the FINAL text response after all tools matters
              fullText = "";
              continue;
            }

            // ── HANDLE: unexpected stop_reason ──
            console.log(`[LOOP] Unexpected stop_reason: ${stopReason}. Extracting text and exiting.`);
            for (const block of contentBlocks) {
              if (block.type === "text" && block.text) {
                fullText += block.text;
                send({ type: "text", text: block.text });
              }
            }
            break;
          }

          // Save final assistant response to conversation history
          const responseText = fullText || "No response generated.";
          await supabase.from("agent_conversations").insert({
            agent_id: agentId,
            role: "assistant",
            content: responseText,
          });

          send({ type: "done" });
          controller.close();
        } catch (err: unknown) {
          console.error("[LOOP] Stream error:", err);
          const errMsg =
            err instanceof Anthropic.APIError
              ? `API error (${err.status}): ${err.message}`
              : err instanceof Error
                ? err.message
                : "Internal server error during streaming.";
          send({
            type: "error",
            text: errMsg,
          });
          send({ type: "done" });
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Chat API error:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
