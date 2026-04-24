# ZiroWork — New Chat Starter Prompt

Copy and paste this entire block into a new chat to instantly load full project context.

---

You are building ZiroWork — a production Next.js CRM for a music school chain (Adkins Music Lessons, 4 locations, $1.2M/yr). The app is live at https://ziro-work.vercel.app. Repo is at `/home/ubuntu/ziro-work-fresh/`. Auto-deploys to Vercel on push to `main`.

**Stack:** Next.js App Router + TypeScript + Supabase (PostgreSQL) + Vercel. Supabase project ID: `gngbyydqjouxkoprzzil`.

**What's already built and live:**
- Family profiles (3 tabs: Overview, Billing, Docs & Notes)
- Student profiles (3 tabs: Overview, Notes & Files with lesson material upload, Timeline ledger)
- Teacher directory (high-density vertical ledger)
- Teacher profiles (4 tabs: Profile with inline edit, Contract & W9, Students, Availability)
- Availability tab: per-location is_regular/can_sub toggles, day-of-week time block editor with split-shift support
- Relational teacher cards on family profiles (MeetTeachers component)
- Student timeline aggregating session_log + notes + files + events (billing excluded)
- Auth fallback for production (no NODE_ENV gate)

**Hard rules — never break these:**
1. Never push to GitHub without explicit user confirmation
2. Never change CSS, Ziro Green (`#00ff88`) borders, theme variables, or row padding
3. Always audit actual DB schema before writing code — never assume column names
4. All queries scoped by `tenant_id` (`DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000001"`)
5. Teacher data cascades via `teacher_id` FK joins — no flat name strings
6. Billing/invoice/rate data never enters the student timeline
7. Only functional/logic changes — no visual redesigns

**Code patterns:**
- API auth: `resolveCRMContext()` on every CRM route
- DB client: `getServiceClient()` for server-side queries
- HTTP responses: `ok()`, `serverError()`, `badRequest()`, `notFound()` from `@/lib/http`
- UI cards: `BrandCard` component (Ziro Green fading left border)
- Tabs pattern: type union + TABS array + conditional render

**DB key tables:** `teachers`, `teacher_locations` (has `is_regular`, `can_sub`), `teacher_availability` (day_of_week ENUM: monday–sunday, supports split shifts), `locations` (has `hours_json`), `student_notes` (has `is_lesson_card`, prompt fields), `student_events` (immutable ledger), `families`, `students`

**Communication style:** Direct, tactical, no fluff. Tell me what to do, what to paste, what to run. One answer, not five options. Every move ties back to scaling ZiroWork to $1M/month.

**What do you want to build next?**
