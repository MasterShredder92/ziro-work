# ZiroWork CRM: Project Instructions & Context

This document serves as the Single Source of Truth (SSOT) for the ZiroWork CRM Next.js application. When starting a new chat or task within this project, provide this document to the AI to instantly load the current state, architecture rules, and design system constraints.

## 1. Core Architecture & Stack
- **Framework:** Next.js (App Router), React, TypeScript
- **Backend/DB:** Supabase (PostgreSQL)
- **Deployment:** Vercel
- **Repository:** `/home/ubuntu/ziro-work-fresh/` (Auto-deploys to Vercel on push)
- **Production URL:** `https://ziro-work.vercel.app`
- **Tenant Isolation:** Multi-tenant system. `DEFAULT_TENANT_ID` is `"00000000-0000-0000-0000-000000000001"`. ALL database queries must be scoped by `tenant_id`.

## 2. Design System & UI Constraints
- **Theme:** High-density dark theme.
- **Brand Colors:** Ziro Green (`#00ff88`). Use for borders, accents, active states, and positive values. Use red for negative values.
- **Card Styling:** The `BrandCard` component is the standard container (features a Ziro Green fading left border).
- **Strict Rule:** **DO NOT** change CSS, Ziro Green borders, theme variables, or row padding. The UI must remain high-density.
- **Component Patterns:** Use inline vertical ledgers for directories (like the Teacher Directory) instead of grid layouts.

## 3. Database & SSOT Principles
- **DB-First Approach:** Always audit the actual Supabase DB schema before writing code. Never assume column names.
- **Relational Integrity (SSOT):** Data like Teacher Names or Locations must cascade globally via foreign key joins (e.g., `teacher_id`, `location_id`). No flat name strings.
- **Key Tables:**
  - `teachers`: Core teacher data (bio, photo_url, instruments, teacher_role).
  - `teacher_locations`: Junction table linking teachers to locations. Includes `is_regular` and `can_sub` boolean columns.
  - `teacher_availability`: Stores weekly availability slots. `day_of_week` is stored as a string ENUM (`monday`–`sunday`) in the DB, but mapped to numeric in the TS data layer. Supports split shifts (multiple rows per day).
  - `locations`: Physical locations. Includes `hours_json` (JSONB) for open/close hours.
  - `student_notes`: Notes and lesson materials. Includes `prompt_context`, `prompt_assignment`, `prompt_focus`, and `is_lesson_card`.
  - `student_events`: Immutable audit ledger for the student timeline.

## 4. API & Authentication Patterns
- **Auth Middleware:** All CRM API routes must use `resolveCRMContext()` to verify session and permissions.
- **Service Client:** Use `getServiceClient()` for server-side Supabase queries to bypass RLS when appropriate within secure API routes.
- **Response Formatting:** Use `ok()`, `serverError()`, `badRequest()`, and `notFound()` from `@/lib/http`.
- **Auth Fallback:** The production environment uses a custom session fallback (`getServiceClient()` when `getUser()` returns null) to prevent 401 errors.

## 5. Specific Feature Contexts
- **Teacher Profile:** Consolidated into 4 tabs: Profile (with inline edit), Contract & W9, Students, and Availability (handles `teacher_locations` and `teacher_availability` CRUD).
- **Student Profile:** Consolidated into 3 tabs: Overview, Notes & Files (unified lesson material upload with gated prompt fields), and Timeline.
- **Timeline Ledger:** The student timeline aggregates data from multiple sources but **strictly excludes** billing, invoice, and rate data.
- **Family Profile:** Consolidated into 3 tabs: Overview (Students list, Account Settings, Meet Teachers), Billing, and Docs & Notes.

## 6. Operational Protocols
- **GitHub Pushes:** **Never push to GitHub automatically.** Always ask the user for explicit confirmation first.
- **Data Privacy:** Never display real personal data (like emails) in examples or outputs. Use anonymized data.
- **Execution Tone:** The user (Zach Adkins) operates in founder-operator mode. Responses must be direct, tactical, short, and built for execution. No fluff, no long explanations. Provide the exact code to paste, the exact command to run, or the exact next step. Focus on momentum and scaling to $1M/month.

## 7. How to Use This Document
When opening a new chat, copy the contents of this document or instruct the AI to read `zirowork_project_instructions.md` from the repo root to instantly align it with the project's current state and rules.
