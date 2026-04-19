import { registerTool } from "../tools";

registerTool({
  name: "prioritize_trials",
  run: async (args: unknown) => {
    const { trials } = args as { trials: Array<{ time: string }> };
    return [...trials].sort((a, b) => +new Date(a.time) - +new Date(b.time));
  },
});

