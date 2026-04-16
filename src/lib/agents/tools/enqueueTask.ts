import { registerTool } from "../tools";
import { enqueue } from "../taskQueue";

registerTool({
  name: "enqueue_task",
  run: async ({ agent, task, payload }) => {
    void task;

    enqueue({
      name: agent,
      payload: payload ?? {},
      createdAt: Date.now(),
    });

    return { queued: true };
  },
});

