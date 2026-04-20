<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:ziro-work-agent-guardrails -->
## Repository roles (read this first)

| Repo | Role |
|------|------|
| **`ziro-work` (this repo)** | **ZiroWork** — the current product. All **default** feature work, UI, APIs, and agents belong **here**. |
| **`music-school-os`** | **Lessonpreneur** legacy shell — historical source data and overlap with old naming. ZiroWork **pulls from / migrates** this; do **not** treat it as the place for new ZiroWork features unless the task is explicitly a **migration slice** or parity fix. |

If a multi-root workspace lists both folders, **still implement in `ziro-work`** unless the user names `music-school-os` for that specific change.

## Scope guardrails (mandatory)

- **Work only inside** `D:\ziro-work` (this repository).
- **Do not read, search, or edit** anything in `music-school-os` unless explicitly instructed for a migration slice.

## Public website freeze (until intake is live)

- **Do not change public-facing website UI/logic** until `/api/intake` is live.
- It is allowed to add/adjust **server-side intake** code under `src/app/api/intake/**` and supporting non-UI utilities needed to make it live.

## Data access façade policy

- Prefer thin wrappers under `lib/data/**` that delegate to existing Supabase query patterns without refactoring legacy logic.
<!-- END:ziro-work-agent-guardrails -->

<!-- BEGIN:zirowork-agent-roster -->
# ZiroWork Agent Roster — Canonical Reference

## ⚡ Ziro — The Leader
- **Role:** Central intelligence of the entire OS
- **Purpose:** Orchestrates all agents, routes tasks, maintains system harmony
- **Energy:** Confident, strategic, the "brain" of ZiroWork
- **Visual:** Charcoal + neon green, ZW spark above head
- **Pages:** `/dashboard`, `/settings`, `/admin`, `/reports`, `/agent-reports`

## 🗓️ Ruby — The Scheduler
- **Role:** Time, calendars, and lesson logistics
- **Purpose:** Books lessons, reschedules, syncs teacher + student availability
- **Energy:** Precise, organized, calm
- **Visual:** Small, white with black accents, glowing calendar
- **Pages:** `/schedule`, `/schedule/events`, `/schedule/rooms`, `/roster`

## 📊 Stewie — The Retention Agent
- **Role:** Engagement + churn prevention
- **Purpose:** Tracks attendance, progress, inactivity; triggers follow-ups
- **Energy:** Analytical, upbeat, data-obsessed
- **Visual:** Slim, orange with white accents, analytics tablet
- **Pages:** `/lifecycle/ongoing-lessons`, `/lifecycle/client-care`, `/lifecycle/retention`, `/lifecycle/win-backs`, `/payroll`

## 💰 Bub — The Financials Agent
- **Role:** Billing, payments, accounting
- **Purpose:** Manages invoices, tuition, balances, financial reports
- **Energy:** Friendly, dependable, methodical
- **Visual:** Fat, orange with black accents, ledger + coins
- **Pages:** `/invoices`, `/financials`, `/billing`

## 🌟 Star — The Leads Agent
- **Role:** Lead capture + conversion
- **Purpose:** Handles CRM, lead scoring, funnels, contact flow
- **Energy:** Magnetic, optimistic, high-vibe
- **Visual:** Gray with purple accents, glowing star orb
- **Pages:** `/lifecycle/inquiries`, `/lifecycle/follow-up`, `/lifecycle/scheduling`, `/lifecycle/enrollment`, `/crm/leads`, `/crm`

## 📚 Vader — The Teacher Agent
- **Role:** Curriculum + teacher coordination
- **Purpose:** Oversees lesson plans, teaching quality, performance metrics
- **Energy:** Wise, structured, mentor-like
- **Visual:** Black with white accents, holographic book
- **Pages:** `/teachers`, `/teachers/[id]`

## 🎒 Sid the Kid — The Student & Family Agent
- **Role:** Student profiles + family communication
- **Purpose:** Onboarding, updates, messaging, student/family engagement
- **Energy:** Friendly, social, approachable
- **Visual:** Black with red accents, backward red cap, student/family tablet
- **Pages:** `/students`, `/students/[id]`, `/families`
<!-- END:zirowork-agent-roster -->
