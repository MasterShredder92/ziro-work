# ZiroWork — Canonical Agent → Page Map

> **DO NOT CHANGE THIS WITHOUT UPDATING agentDefinitions.ts AND ALL AFFECTED _client.tsx FILES.**
> Last locked: April 2026

This is the single source of truth for which agent appears on which page.
Any deviation from this map is a bug.

---

## Agent Assignments

| Agent | Pages | What They Do |
|---|---|---|
| **Ziro** | `/dashboard`, `/settings`, `/admin`, `/reports`, `/agent-reports` | System overview, orchestration, KPIs, onboarding |
| **Ruby** | `/schedule`, `/schedule/events`, `/schedule/rooms` | Scheduling, availability, conflicts, makeups |
| **Sid** | `/students`, `/students/[id]`, `/families`, `/roster` | Student profiles, family accounts, contact info |
| **Stewie** | `/crm`, `/lifecycle`, `/lifecycle/*` | Retention, churn risk, engagement, CRM hub |
| **Star** | `/crm/leads`, `/lifecycle/inquiries`, `/lifecycle/enrollment`, `/recruitment` | Leads, enrollment pipeline, conversion |
| **Vader** | `/teachers`, `/teachers/[id]` | Teacher profiles, W-9 compliance, pay rates |
| **Bub** | `/invoices`, `/financials`, `/billing`, `/payroll` | Billing, invoices, revenue, payroll |

---

## Rules

1. **Vader is ONLY on teacher pages.** Never on CRM, families, or students.
2. **Sid owns families.** `/families` is Sid, not Stewie.
3. **Stewie owns the CRM hub** (`/crm`). Star owns `/crm/leads` only.
4. **Ruby does not own roster.** Roster is Sid.
5. **Bub owns payroll.** Not Vader, not Ziro.
6. **Ziro is the fallback** for any page not explicitly listed above.

---

## Files to Update When Changing Assignments

1. `src/lib/agents/agentDefinitions.ts` — `pages` array for each agent
2. The `_client.tsx` or `_hub-client.tsx` for the affected page — `agentId` prop on `<AgentPageBar>`
3. This file (`AGENT_PAGE_MAP.md`)

---

## Current Component Locations

| Page | Component File |
|---|---|
| `/crm` hub | `src/app/(app)/crm/_hub-client.tsx` |
| `/families` | `src/app/(app)/families/_client.tsx` |
| `/students` list | `src/app/(app)/students/_client.tsx` |
| `/students/[id]` | `src/app/(app)/students/[id]/_client.tsx` |
| `/roster` | `src/app/(app)/roster/_client.tsx` |
| `/teachers` | `src/app/(app)/teachers/_client.tsx` |
| `/teachers/[id]` | `src/app/(app)/teachers/[id]/_client.tsx` |
| `/invoices` | `src/app/(app)/invoices/_client.tsx` |
| `/financials` | `src/app/(app)/financials/_client.tsx` |
| `/payroll` | `src/app/(app)/payroll/_client.tsx` |
| `/schedule` | `src/app/(app)/schedule/components/MultiLocationScheduleClient.tsx` (RubyScheduleBar) |
