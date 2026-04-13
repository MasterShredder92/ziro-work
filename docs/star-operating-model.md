Ziro Work decision sheet
1. Core operating model
STAR’s job

STAR is the manager, not the worker.

STAR does only this:

receive request
classify request
choose the right agent template
choose the right skill bundle
choose the runtime
create or reuse the agent
monitor execution
review result
save the task history cleanly
escalate if needed

STAR does not:

manually do every task herself
hold every skill in one giant prompt
bypass approval rules
directly mutate high-risk systems without the right agent/runtime
stay bloated with long-lived junk context
2. Visible system scope right now
Front-facing active scope

Only show agents/templates relevant to music school operations:

STAR Orchestrator
Product Builder
CRM Operator
Enrollment / Lead Intake Operator
Scheduling / Admin Operator
Content / REEL Operator
QA / Recovery Agent
Reporting / Analytics Agent
Hidden but preserved in database

Keep these hidden from the UI for now:

cold outreach agents
broad GTM agents
general ZiroWork marketplace agents
experimental agents
old visual nodes that do not fit music school ops right now
Rule

Add a field like:

is_visible_in_ui boolean default true
is_archived boolean default false
business_context text default 'music_school'

Old agents get:

is_visible_in_ui = false
is_archived = true or business_context = 'future'

That solves the UI clutter without data loss.

3. Final initial agent roster
A. STAR Orchestrator

Purpose:

classify
route
supervise
review
summarize
save clean records

Runtime:

none directly for most work
may use API/read tools for routing and review

Skills:

task-classification
template-selection
review-writing
queue-supervision

Can edit:

priority
routing choice
retry decision
ephemeral agent spawn proposal

Cannot edit:

secrets
deployment permissions
production auth rules
destructive actions
hard caps
B. Product Builder

Purpose:

fix code
build features
patch bugs
support Lessonpreneur / music school app work

Runtime:

claude_code

Skills:

nextjs-code-fix
repo-inspector
build-validator
vercel-deploy-readiness

Can edit:

app code
UI components
API routes
test code
migrations if approved

Cannot edit:

production secrets
unrelated repos
auth/billing without approval
direct prod DB mutation without task scope
C. CRM Operator

Purpose:

manage student/family/teacher CRM operations
update records
fix workflow problems
handle operations tasks

Runtime:

api first
browser second if needed

Skills:

supabase-query
crm-browser-operator
record-audit
safe-mutation

Can edit:

allowed record fields
internal statuses
internal notes
approved operational workflows

Cannot edit:

billing
user permission grants
mass destructive deletes
cross-tenant data
secret config
D. Enrollment / Lead Intake Operator

Purpose:

handle public lead flow
monitor intake
teacher matching
conversion path QA
landing page form operations

Runtime:

api + browser

Skills:

lead-intake-monitor
teacher-match-check
submission-recovery
conversion-path-qa

Can edit:

form mappings
non-destructive intake logic
fallback paths
lead workflow status

Cannot edit:

payment flows without approval
public pricing globally
auth rules
DNS / infra
E. Scheduling / Admin Operator

Purpose:

scheduling logic
attendance/admin workflow
family/teacher scheduling support
drill-down navigation issues

Runtime:

api or browser

Skills:

scheduling-ops
admin-workflow-check
record-lookup
task-audit

Can edit:

schedule-related ops logic
internal task states
approved admin workflows

Cannot edit:

payroll
billing
mass deletes
user roles/permissions
F. Content / REEL Operator

Purpose:

transcript to clips
captions
short-form content prep
queue for approval

Runtime:

manual initially, maybe api later

Skills:

content-repurpose
caption-writer
clip-moment-selector
brand-voice-pack

Can edit:

caption drafts
clip suggestions
content queue metadata

Cannot edit:

publishing directly without approval
brand voice core without admin change
account credentials
G. QA / Recovery Agent

Purpose:

verify outputs
find failure stage
recommend retry/escalate
prevent silent failure

Runtime:

any read-only runtime needed

Skills:

analytics-summary
artifact-verifier
task-review-writer
failure-classifier

Can edit:

review verdict
retry recommendation
failure classification

Cannot edit:

approve high-risk destructive work automatically
deploy
mutate production data outside explicit recovery task
H. Reporting / Analytics Agent

Purpose:

KPI summaries
operational dashboard reads
exception finding
risk reports

Runtime:

api

Skills:

analytics-summary
supabase-query
trend-detector
ops-summary

Can edit:

report layouts
threshold settings
summary wording

Cannot edit:

source-of-truth data directly
destructive DB actions
4. What is editable vs locked
Editable by admin

These should be editable in UI:

template display name
color
node position
description
active/inactive
visible/hidden in UI
business context
routing priority weight
timeout
retry count
budget ceilings
success criteria text
failure criteria text
assigned skill list within cap
brand voice configs
output format rules
Editable by STAR at runtime
task priority
chosen agent from allowed set
ephemeral vs persistent use
retry vs escalate
queue ordering within rules
task summary
review summary
Editable only by developer/admin, not STAR
env vars
secret scopes
service role keys
Vercel project config
Supabase project config
auth rules
RLS
destructive schema changes
allowed domains list
runtime adapter enable/disable
max active agents
max skills per template
approval matrix
hidden/archived system agents
Not editable at all from normal UI
audit logs
historical task run records
raw system traces
production deployment history
archived task transcripts
5. Permissions matrix
Low risk — auto allowed

STAR can auto-run:

read queries
reporting
internal summaries
non-destructive analytics
draft content
task routing
ephemeral agent creation from existing approved templates
Medium risk — allowed with task scope

STAR can run if template supports it:

code changes in approved repo
non-destructive CRM record updates
content generation
internal workflow fixes
queue processing
High risk — approval required

Requires your explicit approval:

production deploy
auth/permissions changes
destructive data changes
billing changes
public pricing edits
mass communication sends
new template creation
new skill creation with live-action capability
publishing content
any cross-system migration
Never allowed automatically
reveal secrets
delete audit history
remove approval logs
unrestricted prod DB writes
raw credential rotation
cross-tenant mutation
touching unrelated repos/projects
6. Runtime support matrix

This matters because a system fails when it routes work to a runtime that does not actually support the task.

claude_code

Use for:

code changes
repo inspection
build fixes
refactors
migrations
local verification

Not for:

authenticated browser work
manual publishing
CRM tasks without repo/API access
api

Use for:

Supabase reads/writes
structured record ops
analytics
queue actions
internal data workflows

Not for:

UI/browser-only flows
tasks that require human-authenticated sessions
browser

Use for:

CRM sites without API
Google-based workflows
authenticated web tools
manual operational interfaces

Not for:

billing/auth/destructive tasks without approval
open web wandering
unsupported domains
manual

Use for:

content packaging
approval queue steps
human-required publish decisions
unimplemented automation paths

Rule:
If a runtime is not implemented, STAR must not route there. She must either:

choose another supported runtime
propose a manual task
escalate
7. Step-by-step lifecycle
For every task
Stage 1 — Intake

Store:

user request
normalized task title
raw description
business context
source chat id
timestamp
Stage 2 — Classification

Set:

category
confidence score
suggested template
suggested runtime
Stage 3 — Routing

Resolve:

agent template
skill list
runtime
budget
timeout
retry policy
risk level
Stage 4 — Agent selection

Decision:

reuse active persistent agent if appropriate
otherwise create ephemeral agent
compile runtime prompt
bind permission scope
Stage 5 — Execution

Write:

task_runs entry
status = running
started_at
worker_id
runtime metadata
Stage 6 — Review

Write:

summary
what worked
what failed
verdict
next action
artifact list
time/cost
Stage 7 — Save to task bank

When task completes:

archive full transcript
archive run record
archive errors/fixes
archive artifacts
store linked conversation thread
show one clean card in UI
Stage 8 — Agent retirement

If ephemeral:

retire immediately after review
keep history
remove from active graph view

That last part is critical. The agent should disappear from live clutter, but the record stays.

8. Task bank / chat bank design

This is one of the smartest requirements you mentioned.

You do not want one endless chat.

You want a task-centered record system.

New objects to add
task_threads

One clean thread per task.
Fields:

id
task_id
agent_id
parent_chat_id
thread_title
started_at
ended_at
status
summary
task_messages

Stores the clean message stream for that task only.
Fields:

id
thread_id
sender_type (user,star,agent,system)
sender_name
message_type (instruction,tool_call,result,error,review)
content
created_at
task_artifacts

Fields:

id
task_id
artifact_type
title
url_or_path
metadata
created_at
task_failures

Fields:

id
task_id
run_id
failure_stage
error_message
recoverable
recovery_action
created_at
UI behavior

Each task becomes one clean expandable timeline:

title
agent
template
runtime
start/end time
final verdict
artifacts
problems
fixes
full thread

That solves the “50,000 chats” problem.

9. Front-end visual design changes
Agent canvas

Keep canvas, but make it operationally clean.

Visible node types
STAR
active persistent agents
currently running ephemeral agents only
Hidden from main canvas
completed ephemeral agents
archived agents
future-context agents
disabled templates
Node interactions
drag
click for details drawer
click skill badges
view current tasks
view recent task history
view status / heartbeat / load
Recommended visual states
active
idle
running
blocked
review_needed
archived
Side panels
Agents
Templates
Skills
Task Bank
Runs
Reviews
Archived
10. What can break at scale
Routing drift

Symptoms:

wrong template chosen
inconsistent outputs

Prevention:

confidence scoring
template scoring weights
QA catches mismatch
analytics on routing success rate
Prompt bloat

Symptoms:

slower runs
higher cost
worse task clarity

Prevention:

1–4 skills max
compile prompts from fragments
no giant universal prompts
Runtime mismatch

Symptoms:

browser-needed task routed to code runtime
fake completion or failure

Prevention:

runtime support matrix
route blocking if runtime unavailable
no stub runtime routing
Credential mismatch

Symptoms:

task has right logic but no permissions

Prevention:

preflight checks
permission matrix
fail fast before run begins
Queue overload

Symptoms:

backlog
stale tasks
slow overnight completion

Prevention:

per-runtime worker pools
queue priority
concurrency limits
max tasks per agent
dead-letter queue
Silent failure

Symptoms:

task says completed but outcome is broken

Prevention:

QA/review layer
artifact verification
post-run checks
explicit failure_stage
Orphaned ephemeral agents

Symptoms:

clutter
stale nodes
confusing UI

Prevention:

TTL
auto-retire after completion
hide completed ephemeral nodes from main canvas
Bad deploy propagation

Symptoms:

one bug spreads

Prevention:

review gate before prod deploy
branch checks
build verification
rollback notes in review
Cross-project confusion

Symptoms:

wrong repo/project touched

Prevention:

hard target validation
project ID checks
directory checks
explicit task target fields

Your handoff notes already show this as a real risk between Ziro Work and Lessonpreneur.

11. Performance / scale model

Design for:

thousands of tasks/day
low active visual clutter
clear history
predictable cost
Rules
STAR is always singular
persistent agents stay limited
ephemeral agents do most execution
completed ephemerals are archived from active canvas
tasks, not chats, are the unit of history
reviews are mandatory for medium/high-risk work
Recommended caps
max 20 active persistent/visible agents
max 4 skills per template
max 3 retries per recoverable task
per-runtime concurrency limits
timeout per task class
budget caps per task class
12. The exact build priorities
Phase 1 — governance and UI cleanup
hide/archive old non-music-school agents in UI
add visible/archived/business-context fields
add task bank/thread tables
clean active canvas behavior
add ephemeral retirement flow
Phase 2 — orchestration hardening
enforce permission matrix
enforce approval matrix
enforce runtime support matrix
block unsupported runtime routing
add preflight checks
Phase 3 — execution quality
artifact verification
failure stage taxonomy
retry policy engine
queue optimization
analytics on routing success/failure
Phase 4 — advanced expansion
re-enable hidden outreach/GTM agents later
multi-vertical shells later
broader marketplace later