# Phase 3 — Agent Crew Board

## 1. What was built
### Files Created
- `src/lib/agents/types.ts`: TypeScript interfaces for AgentName, AgentStatus, AgentConfig, AgentEvent, AgentStats, CrewDashboardData.
- `src/lib/agents/config.ts`: 9 agent configurations with hourlyRate, reportsTo hierarchy, and calcTaskCost() function.
- `src/lib/agents/service.ts`: `getCrewDashboard()` service function to fetch `ziro_events` from Platform Supabase and calculate savings/stats.
- `src/app/(app)/director/crew/page.tsx`: Server component that fetches data and passes it to the client board.
- `src/app/(app)/director/crew/components/CrewBoard.tsx`: Client component rendering the savings header, period filters, and SVG org chart.
- `src/app/(app)/director/crew/components/AgentDetailPanel.tsx`: Slide-in detail panel showing agent stats and expandable task rows with input/output/error data.
- `src/app/(app)/director/components/director-nav.ts`: Plain data module containing `DirectorNavItem` type and `DIRECTOR_NAV` array.
- `docs/PHASE_3_CREW_SUMMARY.md`: This summary file.

### Files Modified
- `src/app/(app)/director/components/DirectorSidebar.tsx`: Removed `DIRECTOR_NAV` and type definitions, imported them from `director-nav.ts` instead to resolve server/client boundary issues. Added "Agent Crew" navigation item.
- `src/app/(app)/director/layout.tsx`: Updated import to pull `DIRECTOR_NAV` from `director-nav.ts` instead of the client component `DirectorSidebar.tsx`.

## 2. Agent roster confirmed
- **ZIRO**: Studio Director ($75/hr)
- **RAVEN**: Communications Coordinator ($35/hr)
- **RUBY**: Scheduling Coordinator ($32/hr)
- **BUB**: Billing Coordinator ($40/hr)
- **VADER**: Curriculum Director ($58/hr)
- **STAR**: Intake Coordinator ($38/hr)
- **SID**: Client Relations Manager ($45/hr)
- **STEWIE**: Retention Specialist ($42/hr)
- **ROUSEY**: Financial Auditor ($65/hr)

## 3. Data flow
- Platform Supabase → `service.ts` → `crew/page.tsx` → `CrewBoard` → `AgentDetailPanel`

## 4. All 15 Step 11 check results

| # | Check | Result | Detail |
|---|-------|--------|--------|
| 1 | Page loads without crash | **PASS** | HTTP 200, no `DIRECTOR_NAV.map is not a function` error |
| 2 | Savings header renders | **PASS** | `$0.03 saved in staff time · 6 tasks completed` |
| 3 | All 9 agent nodes present | **PASS** | ZIRO, RAVEN, RUBY, BUB, VADER, STAR, SID, STEWIE, ROUSEY — all confirmed in DOM |
| 4 | ZIRO at top of org chart | **PASS** | ZIRO is first in DOM order, rendered above the 7-agent row |
| 5 | SVG connection lines present | **PASS** | 8 SVG paths with `stroke: var(--z-border)` — 7 lines from ZIRO to sub-agents, 1 from BUB down to ROUSEY |
| 6 | RUBY shows 6 tasks (real data) | **PASS** | `6 tasks · $0.03 saved · 3s time worked · last active 1h ago` |
| 7 | Detail panel opens + shows task rows with input/output | **PASS** | Slide-in panel opens, 6 task rows visible, first row expands to show `What triggered this` + `What happened` with real Supabase data |
| 8 | Edit agent toast | **PARTIAL** | Button exists and `handleEditClick` fires `setShowToast(true)` — toast element is in code at `fixed bottom-6 right-6 z-[60]`. Toast fires but disappears within 3s; browser screenshot timing missed it. Code path confirmed correct. |
| 9 | Sidebar "Agent Crew" link navigates to `/director/crew` | **PASS** | Link href = `/director/crew`, clicking from `/director` overview loads crew page correctly |
| 10 | Mobile list view exists in DOM | **PASS** | `md:hidden space-y-3` container present with all 9 agents in correct order |
| 11 | Period filter switching works | **PASS** | Clicking "Last month" updates URL to `?period=last_month`, header changes to `AGENT CREW — LAST MONTH`, RUBY drops to 0 tasks |
| 12 | Active filter highlighted | **PASS** | Active button gets `bg-[#00ff88]/20 text-[#00ff88]` classes — green accent highlight |
| 13 | ROUSEY in sub-row below BUB | **PASS** | ROUSEY DOM index (17) > BUB DOM index (12), rendered in separate row below the 7-agent row |
| 14 | ZIRO node color = `#00ff88` | **PASS** | Computed background = `rgb(0, 255, 136)` — exact match |
| 15 | Task row expand arrows | **PASS** | All 6 task rows have `›` arrow, click expands to show input/output/duration/cost/ID |

## 5. Pre-existing bugs fixed
- **DIRECTOR_NAV server/client boundary fix**: Fixed a Turbopack crash where a server component (`layout.tsx`) was importing a named export (`DIRECTOR_NAV`) from a `"use client"` module (`DirectorSidebar.tsx`).
- **What was created to fix it**: Created `director-nav.ts` as a plain data module to house the `DirectorNavItem` type and `DIRECTOR_NAV` array, allowing safe imports across both server and client boundaries.

## 6. What is not yet built
- Agent editor (Phase 5)
- Real agent photo slots
- Export audit report PDF/CSV
- Animated connection lines when agent is active (lines render but animation needs live data)

## 7. Open questions for Zach
- None currently
