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
const WORKER_ID = `worker-${os.hostname()}-${process.pid}`;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[WORKER] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  db: { schema: 'public' },
  auth: { persistSession: false, autoRefreshToken: false },
});

let isRunning = false;

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function logError(msg) {
  console.error(`[${new Date().toISOString()}] ${msg}`);
}

/** STAR plus any specialist placed in a Zirorb (matches routeTask / Star Control delegation). */
async function loadExecutorAgentIds() {
  const { data, error } = await supabase
    .from('agents')
    .select('id, slug, zirorb_id')
    .eq('business_context', 'music_school')
    .eq('is_archived', false);

  if (error || !data?.length) {
    logError(`Failed to load executor agents: ${error?.message || 'no rows'}`);
    process.exit(1);
  }

  const ids = [];
  for (const row of data) {
    if (row.slug === 'star' || row.zirorb_id) ids.push(row.id);
  }
  if (ids.length === 0) {
    logError('No executor agents (need STAR and/or specialists with zirorb_id)');
    process.exit(1);
  }

  log(`Polling agent_tasks for ${ids.length} executor(s) (STAR + Zirorb specialists)`);
  return ids;
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

const STUCK_THRESHOLD_MS = 10 * 60 * 1000;
const RETRY_DELAY_MS = 60_000;

async function recoverStuckTasks(agentIds) {
  const cutoff = new Date(Date.now() - STUCK_THRESHOLD_MS).toISOString();

  const { data: stuck, error } = await supabase
    .from('agent_tasks')
    .select('id, title, retry_count')
    .in('agent_id', agentIds)
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
      const { error: updateErr } = await supabase
        .from('agent_tasks')
        .update({
          status: 'failed_permanent',
          retry_count: retryCount,
          result: 'Task stuck in running state after retry. Marked as permanently failed.',
          completed_at: new Date().toISOString(),
          failure_stage: 'stuck_timeout',
        })
        .eq('id', task.id);

      if (updateErr) {
        logError(`[${task.id}] "${task.title}" — failed to mark failed_permanent: ${updateErr.message}`);
      } else {
        log(`[${task.id}] "${task.title}" — STUCK → FAILED_PERMANENT (retry_count: ${retryCount})`);
      }
    } else {
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
    .update({
      status: 'running',
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .in('status', ['pending', 'retry'])
    .select();

  if (error) {
    logError(`Claim error for task ${taskId}: ${error.message}`);
    return false;
  }

  return data && data.length > 0;
}

// Create a task_runs row for this execution attempt
async function createTaskRun(task) {
  const attemptNumber = (task.retry_count || 0) + 1;

  const { data, error } = await supabase
    .from('task_runs')
    .insert({
      task_id: task.id,
      template_id: task.agent_template_id || null,
      agent_id: task.agent_id || null,
      runtime: task.runtime || 'claude_code',
      skill_ids: task.skill_ids || [],
      composed_prompt: (task.description || '').slice(0, 10000),
      status: 'running',
      attempt_number: attemptNumber,
      worker_id: WORKER_ID,
      input_snapshot: JSON.stringify({
        title: task.title,
        task_type: task.task_type,
        priority: task.priority,
      }),
    })
    .select('id')
    .single();

  if (error) {
    logError(`[TASK_RUN] Failed to create for task ${task.id}: ${error.message}`);
    return null;
  }

  log(`[TASK_RUN] Created run ${data.id} for task ${task.id} (attempt ${attemptNumber})`);
  return data.id;
}

// Finalize a task_runs row
async function finalizeTaskRun(runId, success, output, durationMs, errorMessage) {
  if (!runId) return;

  const { error } = await supabase
    .from('task_runs')
    .update({
      status: success ? 'complete' : 'failed',
      result_snapshot: (output || '').slice(0, 10000),
      duration_ms: durationMs,
      error_message: errorMessage || null,
      completed_at: new Date().toISOString(),
    })
    .eq('id', runId);

  if (error) {
    logError(`[TASK_RUN] Failed to finalize run ${runId}: ${error.message}`);
  }
}

// Write a STAR review after task completion/failure
async function writeStarReview(runId, task, output, success, durationMs) {
  if (!runId) return;

  const resultLower = (output || '').toLowerCase();

  // Determine verdict
  let verdict;
  if (success) {
    const hasWarnings = resultLower.includes('warning') || resultLower.includes('skipped') || resultLower.includes('partial');
    verdict = hasWarnings ? 'needs_human' : 'approved';
  } else {
    const isRetryable = resultLower.includes('timeout') || resultLower.includes('rate limit') || resultLower.includes('temporary');
    verdict = isRetryable ? 'retry' : 'escalate';
  }

  // Extract what_worked / what_failed
  const what_worked = [];
  const what_failed = [];

  if (success) {
    what_worked.push(`Task "${task.title}" completed`);
    if (resultLower.includes('commit')) what_worked.push('Changes committed to git');
    if (resultLower.includes('verified')) what_worked.push('Verification checks passed');
    if (resultLower.includes('ready to push')) what_worked.push('Ready for deployment');
  } else {
    what_failed.push(`Task "${task.title}" failed`);
    const errorLines = output.split('\n')
      .filter(l => /error|failed|exception|cannot/i.test(l))
      .slice(0, 5);
    what_failed.push(...errorLines);
  }

  // Next action
  let next_action = null;
  if (verdict === 'escalate') next_action = 'Task failed. Review error output and consider manual intervention.';
  else if (verdict === 'retry') next_action = 'Transient failure detected. Automatic retry recommended.';
  else if (verdict === 'needs_human') next_action = 'Completed with warnings. Human review recommended.';
  else if (resultLower.includes('ready to push')) next_action = 'Ready for deployment. Tell STAR to push.';

  // Build summary
  const durationStr = durationMs ? ` (${Math.round(durationMs / 1000)}s)` : '';
  let summary;
  if (verdict === 'approved') summary = `Task completed successfully${durationStr}. ${what_worked.join('. ')}.`;
  else if (verdict === 'needs_human') summary = `Task completed with warnings${durationStr}. Human review needed.`;
  else if (verdict === 'retry') summary = `Task failed with transient error${durationStr}. Retry recommended.`;
  else summary = `Task failed${durationStr}. ${what_failed[0] || 'Unknown error'}.`;

  // Insert review
  const { data, error } = await supabase
    .from('star_reviews')
    .insert({
      run_id: runId,
      summary,
      what_worked,
      what_failed,
      next_action,
      verdict,
    })
    .select('id')
    .single();

  if (error) {
    logError(`[REVIEW] Failed to save for task ${task.id}: ${error.message}`);
    return;
  }

  // Update agent_tasks with review summary
  await supabase
    .from('agent_tasks')
    .update({
      review_summary: summary,
      review_status: verdict,
      updated_at: new Date().toISOString(),
    })
    .eq('id', task.id);

  log(`[REVIEW] Saved review ${data.id} for task ${task.id} — verdict: ${verdict}`);
}

async function handleTaskFailure(task, output, elapsed, runId, threadId) {
  const retryCount = (task.retry_count || 0) + 1;

  if (retryCount > 1) {
    const { error } = await supabase
      .from('agent_tasks')
      .update({
        status: 'failed_permanent',
        retry_count: retryCount,
        result: output,
        completed_at: new Date().toISOString(),
        failure_stage: 'execution',
      })
      .eq('id', task.id);

    if (error) {
      logError(`[${task.id}] "${task.title}" — failed to mark failed_permanent: ${error.message}`);
    } else {
      log(`[${task.id}] "${task.title}" — FAILED → FAILED_PERMANENT (${elapsed}s, retry_count: ${retryCount})`);
    }

    // Log failure diagnostics
    await logFailure(task.id, runId, 'execution', output.slice(0, 2000), false, 'Manual intervention required');

    // Write review for permanent failure
    await writeStarReview(runId, task, output, false, elapsed * 1000);

    // Close thread
    await closeThread(threadId, `Task failed permanently after ${retryCount} attempts.`);

    // Retire ephemeral agent on permanent failure
    await retireEphemeralAgent(task.agent_id);
  } else {
    log(`[${task.id}] "${task.title}" — FAILED → will retry in ${RETRY_DELAY_MS / 1000}s (retry_count: ${retryCount})`);

    // Log recoverable failure
    await logFailure(task.id, runId, 'execution_retry', output.slice(0, 2000), true, 'Automatic retry');
    await appendMessage(threadId, 'system', 'error', `Attempt ${retryCount} failed. Retrying...`);

    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));

    const { error } = await supabase
      .from('agent_tasks')
      .update({
        status: 'pending',
        retry_count: retryCount,
        result: output,
        failure_stage: 'execution_retry',
      })
      .eq('id', task.id);

    if (error) {
      logError(`[${task.id}] "${task.title}" — failed to set retry status: ${error.message}`);
    } else {
      log(`[${task.id}] "${task.title}" — RETRYING (reset to pending, retry_count: ${retryCount})`);
    }
  }
}

// Create a task thread for this execution
async function createThread(task) {
  const { data, error } = await supabase
    .from('task_threads')
    .insert({
      task_id: task.id,
      agent_id: task.agent_id || null,
      thread_title: task.title,
      status: 'open',
    })
    .select('id')
    .single();

  if (error) {
    logError(`[THREAD] Failed to create for task ${task.id}: ${error.message}`);
    return null;
  }

  // Link thread to agent_tasks
  await supabase.from('agent_tasks').update({ thread_id: data.id }).eq('id', task.id);
  log(`[THREAD] Created thread ${data.id} for task ${task.id}`);
  return data.id;
}

// Append a message to a task thread
async function appendMessage(threadId, senderType, messageType, content) {
  if (!threadId) return;
  await supabase.from('task_messages').insert({
    thread_id: threadId,
    sender_type: senderType,
    sender_name: senderType === 'system' ? 'worker' : 'star',
    message_type: messageType,
    content: (content || '').slice(0, 10000),
  });
}

// Close a task thread
async function closeThread(threadId, summary) {
  if (!threadId) return;
  await supabase.from('task_threads').update({
    status: 'closed',
    ended_at: new Date().toISOString(),
    summary: (summary || '').slice(0, 2000),
  }).eq('id', threadId);
}

// Log a task failure
async function logFailure(taskId, runId, stage, errorMessage, recoverable, recoveryAction) {
  await supabase.from('task_failures').insert({
    task_id: taskId,
    run_id: runId,
    failure_stage: stage,
    error_message: (errorMessage || '').slice(0, 2000),
    recoverable,
    recovery_action: recoveryAction || null,
  });
}

// Retire ephemeral agent after task completion
async function retireEphemeralAgent(agentId) {
  if (!agentId) return;
  const { data: agent } = await supabase
    .from('agents')
    .select('id, mode, slug')
    .eq('id', agentId)
    .single();

  if (!agent || agent.mode !== 'ephemeral') return;

  await supabase.from('agents').update({
    status: 'retired',
    is_visible_in_ui: false,
    is_archived: true,
    current_load: 0,
    updated_at: new Date().toISOString(),
  }).eq('id', agentId);

  log(`[RETIRE] Ephemeral agent ${agent.slug} (${agentId}) retired`);
}

async function completeTask(taskId, title, result, elapsed, runId, task) {
  const { error } = await supabase
    .from('agent_tasks')
    .update({
      status: 'complete',
      result,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId);

  if (error) {
    logError(`[${taskId}] "${title}" — failed to mark complete: ${error.message}`);
  } else {
    log(`[${taskId}] "${title}" — COMPLETE (${elapsed}s)`);
  }

  // Write review for successful completion
  await writeStarReview(runId, task, result, true, elapsed * 1000);

  // Retire ephemeral agent
  await retireEphemeralAgent(task.agent_id);
}

async function pollAndExecute(agentIds) {
  if (isRunning) return;

  // Recover stuck tasks every tick
  await recoverStuckTasks(agentIds);

  const { data: tasks, error } = await supabase
    .from('agent_tasks')
    .select('id, title, description, retry_count, agent_id, agent_template_id, skill_ids, runtime, task_type, priority')
    .in('agent_id', agentIds)
    .in('status', ['pending', 'retry'])
    .order('priority', { ascending: false })
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
  log(`[${task.id}] "${task.title}" — PICKED UP (retry_count: ${task.retry_count || 0}, runtime: ${task.runtime || 'claude_code'})`);

  const claimed = await claimTask(task.id);
  if (!claimed) {
    log(`[${task.id}] "${task.title}" — already claimed by another worker`);
    return;
  }

  log(`[${task.id}] "${task.title}" — STARTED`);

  // Create task_runs row
  const runId = await createTaskRun(task);

  // Create task thread for this execution
  const threadId = await createThread(task);
  await appendMessage(threadId, 'system', 'instruction', `Task "${task.title}" started by ${WORKER_ID}`);
  await appendMessage(threadId, 'user', 'instruction', task.description || '(no description)');

  isRunning = true;
  try {
    const { success, output, elapsed } = await runClaudeCode(task.description, task.id);

    // Log the result to the thread
    await appendMessage(threadId, 'agent', 'result', output || '(no output)');

    // Finalize the task_runs row
    await finalizeTaskRun(
      runId,
      success,
      output,
      elapsed * 1000,
      success ? null : output.slice(0, 2000)
    );

    if (success) {
      await completeTask(task.id, task.title, output, elapsed, runId, task);
      await closeThread(threadId, `Task completed successfully in ${elapsed}s.`);
    } else {
      await handleTaskFailure(task, output, elapsed, runId, threadId);
    }
  } finally {
    isRunning = false;
  }
}

async function main() {
  log(`Lessonpreneur Worker starting... (${WORKER_ID})`);

  const agentIds = await loadExecutorAgentIds();

  log('Running startup stuck task recovery...');
  await recoverStuckTasks(agentIds);

  log(`Polling every ${POLL_INTERVAL / 1000}s for pending tasks...`);

  const tick = async () => {
    try {
      await pollAndExecute(agentIds);
    } catch (err) {
      logError(`Unexpected error: ${err.message}`);
    }
  };

  await tick();
  setInterval(tick, POLL_INTERVAL);
}

main();
