# ZiroWork CRM — Project Instructions

## Identity & Mission
You are building ZiroWork, a production SaaS CRM for music school chains. The primary tenant is Adkins Music Lessons (4 locations, $1.2M/yr). Every feature built must tie back to scaling ZiroWork to $1M/month in SaaS revenue. No distractions, no side quests.

## Live Environment
- **Production URL:** https://ziro-work.vercel.app
- **Repo path:** `/home/ubuntu/ziro-work-fresh/`
- **GitHub:** Auto-deploys to Vercel on push to `main`
- **Supabase project ID:** `gngbyydqjouxkoprzzil`
- **Default Tenant ID:** `00000000-0000-0000-0000-000000000001`

## Tech Stack
Next.js App Router, TypeScript, Supabase (PostgreSQL), Vercel, TailwindCSS (dark theme, no changes allowed).

## Design System — IMMUTABLE RULES
- Theme is high-density dark. Background `#0a0a0c`, card borders `#1c1c1e`, inputs `#111113`.
- Brand accent: Ziro Green `#00ff88`. Used for active states, borders, positive values, CTAs.
- `BrandCard` component = Ziro Green fading left border card. Use for all major content sections.
- Directory views use inline vertical ledgers (NOT grids). Each row has a Ziro Green left border, fading gradient separator, emoji instrument pills, status pills.
- **NEVER change CSS, Ziro Green borders, theme variables, or row padding.** No visual redesigns.

## SSOT Architecture Rules
- All teacher data cascades via `teacher_id` FK joins. No flat name strings stored anywhere.
- All location data cascades via `location_id` FK joins.
- All queries must be scoped by `tenant_id`. No unscoped queries.
- Always audit actual DB schema before writing code. Run `execute_sql` via Supabase MCP to verify column names.
- Billing/invoice/rate data is strictly excluded from the student timeline.

## API Patterns
Every CRM API route must follow this pattern:
1. Call `resolveCRMContext(req, { permissions: [...], minRole: "..." })` at the top
2. Use `getServiceClient()` for all DB queries
3. Return `ok()`, `serverError()`, `badRequest()`, or `notFound()` from `@/lib/http`
4. Column whitelist all PATCH endpoints — never pass raw body to DB

## Authentication
Production uses a custom session fallback: when `getUser()` returns null, `getServiceClient()` is used as fallback. The `NODE_ENV` gate has been removed. Do not re-add it.

## What's Built (Current State)
| Feature | Status | Key Files |
|---|---|---|
| Family Profile (3 tabs) | Live | `src/app/(app)/crm/families/[id]/_content.tsx` |
| Student Profile (3 tabs) | Live | `src/app/(app)/students/[id]/_content.tsx` |
| Teacher Directory (ledger) | Live | `src/app/(app)/teachers/_client.tsx` |
| Teacher Profile (4 tabs) | Live | `src/app/(app)/teachers/[id]/_client.tsx` |
| Availability Tab | Live | Same as above + `/api/crm/teachers/[id]/locations` + `/api/crm/teachers/[id]/availability` |
| Student Timeline Ledger | Live | `src/app/api/crm/students/[id]/timeline/route.ts` |
| Relational Teacher Cards | Live | `src/app/api/crm/families/[id]/teachers/route.ts` |
| Student Notes + Lesson Cards | Live | `src/app/api/crm/students/[id]/notes/route.ts` |

## Key DB Tables
| Table | Key Columns |
|---|---|
| `teachers` | `id`, `tenant_id`, `teacher_role`, `bio`, `photo_url`, `instruments[]`, `w9_status`, `contract_status` |
| `teacher_locations` | `teacher_id`, `location_id`, `is_regular` (bool), `can_sub` (bool) |
| `teacher_availability` | `teacher_id`, `location_id`, `day_of_week` (ENUM: monday–sunday), `start_time`, `end_time` |
| `locations` | `id`, `tenant_id`, `name`, `color`, `hours_json` (JSONB), `is_active` |
| `students` | `id`, `tenant_id`, `family_id`, `teacher_id`, `instrument`, `status` |
| `student_notes` | `student_id`, `note_type`, `is_lesson_card`, `prompt_context`, `prompt_assignment`, `prompt_focus`, `file_url`, `file_name` |
| `student_events` | Immutable audit ledger — never write billing data here |
| `families` | `id`, `tenant_id`, primary contact fields |

## Operational Protocols
- **GitHub:** Never push automatically. Always ask for explicit confirmation.
- **DB migrations:** Use `manus-mcp-cli tool call apply_migration --server supabase` for schema changes. Always verify with `execute_sql` after.
- **TypeScript:** Run `npx tsc --noEmit 2>&1 | grep -c "error TS"` before every commit. Must be 0.
- **Vercel deploy:** After push, wait ~90 seconds then verify live URL.

## Communication Style
Direct, tactical, operator-grade. No fluff, no long explanations, no theory. Tell the user what to do, what to paste, what to run. One clear answer. Every suggestion ties back to revenue and scale.
