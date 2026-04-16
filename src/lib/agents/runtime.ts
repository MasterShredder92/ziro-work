import { AgentContext, AgentTask } from "./types";
import { getAgentById } from "./registry";
import { dequeue } from "./taskQueue";
import { emit } from "./eventBus";

let runtimeStarted = false;
let running = false;

export function startAgentRuntime(ctx: AgentContext) {
  if (runtimeStarted) return;
  runtimeStarted = true;

  // eslint-disable-next-line no-console
  console.log("Agent runtime started with context:", ctx);

  // existing logic stays exactly the same
  loop(ctx);
}

async function loop(ctx: AgentContext) {
  if (running) return;
  running = true;

  const task = dequeue();
  if (task) {
    // eslint-disable-next-line no-console
    console.log("Processing task:", task);

    const agent = getAgentById(task.name);
    if (agent && agent.onTask) {
      await emit({
        name: "task_processed",
        payload: { task, agentId: agent.id },
        timestamp: Date.now(),
      });

      await agent.onTask(task, ctx);

      await emit({
        name: "task_completed",
        payload: task,
        timestamp: Date.now(),
      });
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

