import { createClient } from '@supabase/supabase-js';
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const POLL_INTERVAL = 30_000;
const WORKING_DIR = 'D:\\music-school-os';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[WORKER] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let isRunning = false;

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function logError(msg) {
  console.error(`[${new Date().toISOString()}] ${msg}`);
}

async function getStarAgentId() {
  const { data, error } = await supabase
    .from('agents')
    .select('id')
    .eq('slug', 'star')
    .single();

  if (error || !data) {
    logError(`Failed to fetch STAR agent ID: ${error?.message || 'not found'}`);
    process.exit(1);
  }

  log(`STAR agent_id: ${data.id}`);
  return data.id;
}

function runClaudeCode(taskDescription, taskId) {
  return new Promise((resolve) => {
    const tmpFile = os.tmpdir() + `\\claude-task-${Date.now()}.txt`;
    fs.writeFileSync(tmpFile, taskDescription, 'utf8');
    log(`Wrote prompt to ${tmpFile} (${taskDescription.length} chars)`);

    const startTime = Date.now();

    const proc = spawn(
      'C:\\Users\\Zach\\.local\\bin\\claude.exe',
      ['--print', taskDescription, '--dangerously-skip-permissions'],
      {
        cwd: WORKING_DIR,
        shell: false,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      }
    );

    // Heartbeat — log every 60s while process is running
    const heartbeat = setInterval(() => {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      log(`[TASK ${taskId}] still running — ${elapsed}s elapsed`);
    }, 60_000);

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      stdout += text;
      console.log(`[CLAUDE] ${text.trim()}`);
    });

    proc.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderr += text;
      console.log(`[CLAUDE ERR] ${text.trim()}`);
    });

    const cleanup = () => {
      clearInterval(heartbeat);
      try { fs.unlinkSync(tmpFile); } catch {}
    };

    proc.on('close', (code) => {
      cleanup();
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      if (code === 0) {
        resolve({ success: true, output: stdout || '(no output)', elapsed });
      } else {
        resolve({ success: false, output: stderr || stdout || `Exit code ${code}`, elapsed });
      }
    });

    proc.on('error', (err) => {
      cleanup();
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      resolve({ success: false, output: `Spawn error: ${err.message}`, elapsed });
    });
  });
}

const STUCK_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes
const RETRY_DELAY_MS = 60_000; // 60 seconds

async function ensureRetryColumn() {
  const { error } = await supabase.rpc('exec_sql', {
    query: 'ALTER TABLE agent_tasks ADD COLUMN IF NOT EXISTS retry_count integer DEFAULT 0;',
  });
  if (error) {
    // Fallback: try direct REST
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          query: 'ALTER TABLE agent_tasks ADD COLUMN IF NOT EXISTS retry_count integer DEFAULT 0;',
        }),
      });
      if (!res.ok) {
        logError(`Failed to ensure retry_count column (REST): ${await res.text()}`);
      } else {
        log('Ensured retry_count column exists (via REST fallback)');
      }
    } catch (err) {
      logError(`Failed to ensure retry_count column: ${err.message}`);
    }
  } else {
    log('Ensured retry_count column exists');
  }
}

async function recoverStuckTasks(agentId) {
  const cutoff = new Date(Date.now() - STUCK_THRESHOLD_MS).toISOString();

  const { data: stuck, error } = await supabase
    .from('agent_tasks')
    .select('id, title, retry_count')
    .eq('agent_id', agentId)
    .eq('status', 'running')
    .lt('updated_at', cutoff);

  if (error) {
    logError(`Stuck task check error: ${error.message}`);
    return;
  }

  if (!stuck || stuck.length === 0) return;

  for (const task of stuck) {
    const retryCount = (task.retry_count || 0) + 1;

    if (retryCount > 1) {
      // Already retried once — mark permanently failed
      const { error: updateErr } = await supabase
        .from('agent_tasks')
        .update({
          status: 'failed_permanent',
          retry_count: retryCount,
          result: 'Task stuck in running state after retry. Marked as permanently failed.',
          completed_at: new Date().toISOString(),
        })
        .eq('id', task.id);

      if (updateErr) {
        logError(`[${task.id}] "${task.title}" — failed to mark failed_permanent: ${updateErr.message}`);
      } else {
        log(`[${task.id}] "${task.title}" — STUCK → FAILED_PERMANENT (retry_count: ${retryCount})`);
      }
    } else {
      // First stuck occurrence — reset to pending for retry
      const { error: updateErr } = await supabase
        .from('agent_tasks')
        .update({
          status: 'pending',
          retry_count: retryCount,
        })
        .eq('id', task.id);

      if (updateErr) {
        logError(`[${task.id}] "${task.title}" — failed to reset stuck task: ${updateErr.message}`);
      } else {
        log(`[${task.id}] "${task.title}" — STUCK → PENDING (retry_count: ${retryCount}, will retry)`);
      }
    }
  }
}

async function claimTask(taskId) {
  const { data, error } = await supabase
    .from('agent_tasks')
    .update({ status: 'running' })
    .eq('id', taskId)
    .in('status', ['pending', 'retry'])
    .select();

  if (error) {
    logError(`Claim error for task ${taskId}: ${error.message}`);
    return false;
  }

  return data && data.length > 0;
}

async function handleTaskFailure(task, output, elapsed) {
  const retryCount = (task.retry_count || 0) + 1;

  if (retryCount > 1) {
    // Already retried — permanent failure
    const { error } = await supabase
      .from('agent_tasks')
      .update({
        status: 'failed_permanent',
        retry_count: retryCount,
        result: output,
        completed_at: new Date().toISOString(),
      })
      .eq('id', task.id);

    if (error) {
      logError(`[${task.id}] "${task.title}" — failed to mark failed_permanent: ${error.message}`);
    } else {
      log(`[${task.id}] "${task.title}" — FAILED → FAILED_PERMANENT (${elapsed}s, retry_count: ${retryCount})`);
    }
  } else {
    // First failure — queue for retry after delay
    log(`[${task.id}] "${task.title}" — FAILED → will retry in ${RETRY_DELAY_MS / 1000}s (retry_count: ${retryCount})`);

    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));

    const { error } = await supabase
      .from('agent_tasks')
      .update({
        status: 'pending',
        retry_count: retryCount,
        result: output,
      })
      .eq('id', task.id);

    if (error) {
      logError(`[${task.id}] "${task.title}" — failed to set retry status: ${error.message}`);
    } else {
      log(`[${task.id}] "${task.title}" — RETRYING (reset to pending, retry_count: ${retryCount})`);
    }
  }
}

async function completeTask(taskId, title, result, elapsed) {
  const { error } = await supabase
    .from('agent_tasks')
    .update({
      status: 'complete',
      result,
      completed_at: new Date().toISOString(),
    })
    .eq('id', taskId);

  if (error) {
    logError(`[${taskId}] "${title}" — failed to mark complete: ${error.message}`);
  } else {
    log(`[${taskId}] "${title}" — COMPLETE (${elapsed}s)`);
  }
}

async function pollAndExecute(agentId) {
  if (isRunning) return;

  // Recover stuck tasks every tick
  await recoverStuckTasks(agentId);

  const { data: tasks, error } = await supabase
    .from('agent_tasks')
    .select('id, title, description, retry_count')
    .eq('agent_id', agentId)
    .in('status', ['pending', 'retry'])
    .order('created_at', { ascending: true })
    .limit(1);

  if (error) {
    logError(`Poll error: ${error.message}`);
    return;
  }

  if (!tasks || tasks.length === 0) {
    return;
  }

  const task = tasks[0];
  log(`[${task.id}] "${task.title}" — PICKED UP (retry_count: ${task.retry_count || 0})`);

  const claimed = await claimTask(task.id);
  if (!claimed) {
    log(`[${task.id}] "${task.title}" — already claimed by another worker`);
    return;
  }

  log(`[${task.id}] "${task.title}" — STARTED`);

  isRunning = true;
  try {
    const { success, output, elapsed } = await runClaudeCode(task.description, task.id);

    if (success) {
      await completeTask(task.id, task.title, output, elapsed);
    } else {
      await handleTaskFailure(task, output, elapsed);
    }
  } finally {
    isRunning = false;
  }
}

async function main() {
  log('Lessonpreneur Worker starting...');

  const agentId = await getStarAgentId();

  // Ensure retry_count column exists
  await ensureRetryColumn();

  // Startup recovery — reset any stuck tasks before first poll
  log('Running startup stuck task recovery...');
  await recoverStuckTasks(agentId);

  log(`Polling every ${POLL_INTERVAL / 1000}s for pending tasks...`);

  const tick = async () => {
    try {
      await pollAndExecute(agentId);
    } catch (err) {
      logError(`Unexpected error: ${err.message}`);
    }
  };

  await tick();
  setInterval(tick, POLL_INTERVAL);
}

main();
