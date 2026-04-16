import { registerTool } from "../tools";

registerTool({
  name: "prioritize_trials",
  run: async ({ trials }) => {
    return trials.sort((a: any, b: any) => +new Date(a.time) - +new Date(b.time));
  },
});

