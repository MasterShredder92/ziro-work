import { AgentContext, AgentTask } from "./types";
import { getAgent } from "./runtimeRegistry";
import { dequeue } from "./taskQueue";
import { publish } from "./eventBus";
import { getStudentStage } from "@/lib/lifecycle/getStudentStage";

let runtimeStarted = false;
let running = false;

export function startAgentRuntime(ctx: AgentContext) {
  if (runtimeStarted) return;
  runtimeStarted = true;

  console.log("Agent runtime started with context:", ctx);

  // existing logic stays exactly the same
  loop(ctx);
}

async function loop(ctx: AgentContext) {
  if (running) return;
  running = true;

  const task = dequeue();
  if (task) {
    console.log("Processing task:", task);

    const agent = getAgent(task.name);
    if (agent && agent.onTask) {
      const raw = (task as AgentTask).payload;
      const payload =
        raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null;
      const studentId: string | null =
        payload && typeof payload.student_id === "string"
          ? payload.student_id
          : payload && typeof payload.studentId === "string"
            ? payload.studentId
            : null;

      if (studentId) {
        try {
          const computed = await getStudentStage(studentId);
          ctx.lifecycle = {
            stage: computed.stage.id,
            blockers: computed.blockers,
            next: computed.next?.id ?? null,
            autoAdvance: computed.autoAdvance,
          };
        } catch (err) {
          console.error("[LIFECYCLE] Failed to compute stage for task context:", err);
          ctx.lifecycle = undefined;
        }
      } else {
        ctx.lifecycle = undefined;
      }

      await publish("task_processed", {
        task,
        agentId: agent.id,
        timestamp: Date.now(),
      });

      await agent.onTask(task, ctx);

      await publish("task_completed", {
        task,
        timestamp: Date.now(),
      });

      if (studentId) {
        try {
          await getStudentStage(studentId);
        } catch (err) {
          console.error("[LIFECYCLE] Failed to recompute stage after task:", err);
        }
      }
    }
  }

  if (!running) return;
  setTimeout(() => {
    void loop(ctx);
  }, 2000);
}

export function stopAgentRuntime() {
  running = false;
}

