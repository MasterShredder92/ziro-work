export {
  listAgents,
  resolveAgent,
  STATIC_AGENT_MANIFEST,
  type ResolvedAgent,
  type ListAgentsOptions,
  type ResolveAgentOptions,
  type StaticAgentManifestEntry,
} from "./agentRegistry";

export {
  resolveSkill,
  listSkillsForAgent,
  type ResolvedSkill,
  type AgentSkillLink,
  type ResolveSkillOptions,
  type ListSkillsForAgentOptions,
} from "./skillRegistry";

export {
  getPageBindings,
  getPageContext,
  getPageContextType,
  getPageRecommendedSkills,
  PAGE_AGENT_MAP,
  PAGE_SKILL_MAP,
  type PageBindings,
  type PageContext,
  type PageContextInput,
  type PageContextType,
  type RecommendedSkill,
} from "./pageIntelligence";

export {
  runTurn,
  type RunTurnInput,
  type TurnResult,
  type TurnMessage,
  type TurnMetadata,
  type ToolCall,
} from "./conversationPipeline";

export { ziro, type ZiroRuntimeClient } from "./client";

export {
  recordSkillInvocation,
  recordError,
  getRecentTelemetry,
  clearTelemetry,
  type TelemetryEvent,
  type SkillInvocationEvent,
  type SkillErrorEvent,
  type RecordSkillInvocationInput,
  type RecordErrorInput,
} from "./telemetry";

export {
  buildTurnContext,
  type BuildTurnContextInput,
  type TurnContext,
} from "./contextBridge";

export {
  buildSystemPrompt,
  type BuildSystemPromptInput,
} from "./systemPrompt";

export {
  runAutoActions,
  type RunAutoActionsInput,
} from "@/lib/ziro/auto/runner";

export {
  autoActionPacks,
} from "@/lib/ziro/auto/actions";

export type {
  AutoActionContext,
  AutoActionDefinition,
  AutoActionDetails,
  AutoActionHandler,
  AutoActionPack,
  AutoActionResult,
  AutoActionRunRecord,
  AutoActionRunSummary,
} from "@/lib/ziro/auto/types";

export {
  startAutoScheduler,
  stopAutoScheduler,
  isAutoSchedulerRunning,
  getAutoSchedulerStatus,
  type StartAutoSchedulerOptions,
} from "./autoScheduler";

export {
  executeTool,
  safeExecuteTool,
  registerTool,
  unregisterTool,
  resolveTool,
  hasTool,
  listRegisteredTools,
  type ExecuteToolResult,
} from "./toolExecutor";

export {
  invokeSkill,
  safeInvokeSkill,
  type InvokeSkillInput,
  type InvokeSkillResult,
} from "./skillInvoker";

export {
  runWorkflow,
  runWorkflowParallel,
  type WorkflowStep,
  type WorkflowStepResult,
  type WorkflowResult,
  type RunWorkflowOptions,
} from "./orchestrator";

export {
  recordSkillStart,
  recordSkillSuccess,
  recordSkillFailure,
  getRecentSkillExecutions,
  clearSkillExecutions,
  type SkillExecutionPhase,
  type SkillExecutionRecord,
  type SkillStartInput,
  type SkillSuccessInput,
  type SkillFailureInput,
} from "./skillTelemetry";
