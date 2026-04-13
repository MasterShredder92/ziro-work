# Lessonpreneur Worker

Background worker that polls `agent_tasks` in Supabase and executes pending tasks for the STAR agent using Claude Code CLI against `D:\lessonpreneur`.

## Start the worker

```bash
node scripts/lessonpreneur-worker.js
```

## Run persistently with pm2

```bash
pm2 start scripts/lessonpreneur-worker.js --name lessonpreneur-worker
```

## Check logs

```bash
pm2 logs lessonpreneur-worker
```

## Stop the worker

```bash
pm2 stop lessonpreneur-worker
```

## Restart / reload

```bash
pm2 restart lessonpreneur-worker
```

## Environment

Reads from `D:\ziro-work\.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (full access)

## How it works

1. On startup, queries the `agents` table for STAR's `agent_id` (where slug = 'star')
2. Polls `agent_tasks` every 30 seconds for rows where `status = 'pending'` and `agent_id` matches STAR
3. Claims the oldest pending task by setting `status = 'running'`
4. Runs `claude -p "[task description]" --dangerously-skip-permissions` with cwd `D:\lessonpreneur`
5. On success: sets `status = 'complete'` and saves stdout to `result`
6. On failure: sets `status = 'failed'` and saves the error to `result`
7. Processes one task at a time — sequential execution only
