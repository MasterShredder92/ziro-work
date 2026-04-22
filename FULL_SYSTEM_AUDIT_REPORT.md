# ZiroWork Full System Audit Report

This report outlines all identified legacy patterns, broken imports, disconnected components, and files that are out of sync with the new Sovereign Agentic Architecture (Vercel AI SDK v6 + Supabase). **No changes have been made to the repository.**

## 1. Database & Orchestrator Type Sync

### 1.1 Legacy Table References
Several routes are still querying the legacy `lessons` and `instructors` tables, which have been replaced in the Sovereign Schema (likely by `schedule_blocks` and `teachers`).
- `src/app/api/agent/state/route.ts` (Lines 39, 57, 58)
- `src/app/api/agent/heartbeat/route.ts` (Lines 39, 53)
- `src/lib/ziro/agents/tools/raven-tools.ts` (Lines 29, 31, 53)

### 1.2 Missing Tenant ID Filters
To ensure data isolation, every Supabase query in the `/api/agent/` directory must include a `tenant_id` filter. The following queries are missing this filter:
- `src/app/api/agent/upload-process/route.ts` (Lines 45, 130)
- `src/app/api/agent/state/route.ts` (Lines 39, 57)
- `src/app/api/agent/heartbeat/route.ts` (Lines 39, 53, 61, 72, 83)

## 2. Vercel AI SDK v6 & Turbopack Compliance

### 2.1 Route Compliance
The core `src/app/api/agent/chat/route.ts` is correctly using the "Raw Object" pattern and `generateText` with explicit `any` casting, bypassing the Turbopack inference bugs.

### 2.2 Legacy Anthropic SDK Usage
The `upload-process` route and the legacy Ruby chat route are still using the direct Anthropic SDK instead of the unified Vercel AI SDK wrapper.
- `src/app/api/agent/upload-process/route.ts`
- `src/app/api/ruby/chat/route.ts`
- `src/app/api/skills/route.ts`

## 3. Frontend Response Handling

The frontend components are out of sync with the backend's JSON response structure. The backend now returns `{ content: [{ type: "text", text: "..." }], reply: "...", toolResults: [...] }`, but the frontend components are looking for different structures or handling streams incorrectly.

- **`src/components/agentOS/AgentFullChat.tsx`**: Uses a custom `fetch` and expects `data.reply` or `data.content[0].text`. It lacks the `@ai-sdk/react` `useChat` hook required for rendering `toolInvocations`.
- **`src/components/agentOS/AgentCommandHub.tsx`**: Similar to `AgentFullChat`, it uses a manual `fetch` and cannot render tool calls.
- **`src/app/(app)/schedule/components/RubySidebar.tsx`**: Uses a manual `fetch` and is disconnected from the agentic reasoning loop.
- **`src/components/agentOS/AgentPageBar.tsx`**: Uses a manual `fetch` and expects `j.reply`.

## 4. Universal Processor Alignment

### 4.1 `upload-process` Route
`src/app/api/agent/upload-process/route.ts` contains "Sid-only" logic gates (Line 36: `if (agentId !== "sid")`) and hardcoded Anthropic calls. It needs to be refactored into a universal processor using `gpt-4o-mini` and the `AGENT_REGISTRY`.

## 5. Duplicate and Legacy Directories

The codebase contains massive duplication between the old `lib/agents` structure and the new `lib/ziro/agents` structure.

### 5.1 Duplicate Definitions
- **Legacy**: `src/lib/agents/agentDefinitions.ts`
- **New**: `src/lib/ziro/agents/definitions.ts`
*Many frontend components (e.g., `TopBar.tsx`, `AgentPipelineCanvas.tsx`, `AgentOSContext.tsx`) are still importing from the legacy `lib/agents/agentDefinitions.ts`.*

### 5.2 Duplicate Tool Registries
- **Legacy**: `src/lib/ziro/tools/` (Contains `bubTools.ts`, `starTools.ts`, `rubyTools.ts`, etc.)
- **New**: `src/lib/ziro/agents/tools/` (Contains `ruby-tools.ts`, `sid-tools.ts`, `index.ts`, etc.)

### 5.3 Duplicate Agent Registries
- **Legacy**: `src/lib/agents/registry.ts`
- **New**: `src/lib/ziro/agents/orchestrator.ts` (and related files)

## 6. Actionable Next Steps (The "Clean Up" Plan)

1. **Update Frontend Imports**: Change all imports of `AGENT_DEFINITIONS` across the `src/components/` directory to point to `src/lib/ziro/agents/definitions.ts`.
2. **Refactor Frontend Chat Hooks**: Replace the manual `fetch` logic in `AgentFullChat.tsx`, `AgentCommandHub.tsx`, and `RubySidebar.tsx` with the `@ai-sdk/react` `useChat` hook to support `toolInvocations`.
3. **Delete Legacy Directories**: Once imports are updated, safely delete `src/lib/agents/` and `src/lib/ziro/tools/`.
4. **Update Supabase Queries**: Replace all instances of `.from("lessons")` and `.from("instructors")` with the new schema tables (`schedule_blocks`, `teachers`), and enforce `.eq("tenant_id", tenantId)` on all agent API routes.
5. **Refactor `upload-process`**: Remove the Anthropic SDK and "Sid-only" gate; route all processing through the Vercel AI SDK and the unified tool registry.
