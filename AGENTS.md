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
