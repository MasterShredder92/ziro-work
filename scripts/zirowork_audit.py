#!/usr/bin/env python3
"""
ZiroWork Pre-Launch Audit Script
=================================
Runs a full static analysis of the ZiroWork codebase and reports:
  1. Missing DB tables (vs. spec)
  2. Missing event emissions in API routes
  3. Mock/dummy data usage in production code
  4. Missing RLS policies
  5. Dead links (href targets with no corresponding page)
  6. Agent tool wiring gaps

Usage:
    cd /path/to/ziro-work-fresh
    python3 scripts/zirowork_audit.py

Exit code: 0 = clean, 1 = issues found
"""

import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
SRC = ROOT / "src"
SUPABASE_TYPES = SRC / "lib" / "types" / "supabase.ts"
API_DIR = SRC / "app" / "api"
APP_DIR = SRC / "app" / "(app)"

PASS = "\033[92m✓\033[0m"
FAIL = "\033[91m✗\033[0m"
WARN = "\033[93m⚠\033[0m"

issues = []
warnings = []

def header(title: str):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def ok(msg: str):
    print(f"  {PASS} {msg}")

def fail(msg: str):
    print(f"  {FAIL} {msg}")
    issues.append(msg)

def warn(msg: str):
    print(f"  {WARN} {msg}")
    warnings.append(msg)

# ─── 1. DB Schema Check ───────────────────────────────────────────────────────

REQUIRED_TABLES = [
    "students", "teachers", "families", "leads", "locations",
    "schedule_blocks", "invoices", "square_invoices", "events",
    "ziro_agents", "ziro_skills", "tenants", "profiles",
    "agentpermissionprofiles", "agenttoolassignments",
    "agenteventsubscriptions", "agent_tasks",
    "agreements", "lessons", "lesson_notes",
    "portalsessions", "review_requests",
]

header("1. DATABASE SCHEMA — Required Tables")

if SUPABASE_TYPES.exists():
    content = SUPABASE_TYPES.read_text()
    for table in REQUIRED_TABLES:
        # Tables appear as "tablename": { OR tablename: { in the generated types
        pattern = rf'(?:"{table}"\s*:|\b{table}\b\s*:)\s*\{{'
        if re.search(pattern, content):
            ok(table)
        else:
            fail(f"Table '{table}' NOT FOUND in supabase.ts — run migration or regenerate types")
else:
    fail(f"supabase.ts not found at {SUPABASE_TYPES}")

# ─── 2. Event Emission Check ─────────────────────────────────────────────────

REQUIRED_EVENTS = {
    "lead.created": str(API_DIR / "leads" / "route.ts"),
    "student.enrolled": str(API_DIR / "crm" / "enrollments" / "route.ts"),
    "agreement.signed": str(API_DIR / "agreements" / "route.ts"),
    "invoice.created": str(API_DIR / "crm" / "enrollments" / "route.ts"),
}

header("2. EVENT EMISSIONS — Required Events")

for event_name, expected_file in REQUIRED_EVENTS.items():
    path = Path(expected_file)
    if not path.exists():
        fail(f"'{event_name}' — file {path.name} does not exist")
        continue
    text = path.read_text()
    if event_name in text:
        ok(f"'{event_name}' emitted in {path.name}")
    else:
        fail(f"'{event_name}' NOT emitted in {path.name}")

# ─── 3. Mock Data Check ───────────────────────────────────────────────────────

MOCK_PATTERNS = [
    r"mockData",
    r"dummyData",
    r"fakeData",
    r"MOCK_",
    r"// TODO.*mock",
    r"hardcoded",
]

header("3. MOCK DATA — Scan for Hardcoded/Fake Data")

mock_found = False
for ts_file in SRC.rglob("*.ts"):
    if "node_modules" in str(ts_file) or "__tests__" in str(ts_file):
        continue
    text = ts_file.read_text(errors="ignore")
    for pattern in MOCK_PATTERNS:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            rel = ts_file.relative_to(ROOT)
            warn(f"{rel}: found '{matches[0]}' ({len(matches)} occurrence(s))")
            mock_found = True

for tsx_file in SRC.rglob("*.tsx"):
    if "node_modules" in str(tsx_file) or "__tests__" in str(tsx_file):
        continue
    text = tsx_file.read_text(errors="ignore")
    for pattern in MOCK_PATTERNS:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            rel = tsx_file.relative_to(ROOT)
            warn(f"{rel}: found '{matches[0]}' ({len(matches)} occurrence(s))")
            mock_found = True

if not mock_found:
    ok("No mock/dummy data patterns found")

# ─── 4. RLS Policy Check ─────────────────────────────────────────────────────

header("4. RLS POLICIES — Check Migrations")

migration_dir = ROOT / "supabase" / "migrations"
rls_tables_found = set()
if migration_dir.exists():
    for sql_file in sorted(migration_dir.glob("*.sql")):
        text = sql_file.read_text(errors="ignore")
        # Find all tables with RLS enabled
        for match in re.finditer(r"alter table public\.(\w+) enable row level security", text, re.IGNORECASE):
            rls_tables_found.add(match.group(1))

CRITICAL_RLS_TABLES = ["students", "teachers", "families", "leads", "invoices", "square_invoices"]
for table in CRITICAL_RLS_TABLES:
    if table in rls_tables_found:
        ok(f"RLS enabled: {table}")
    else:
        warn(f"RLS not confirmed in migrations for: {table} — verify in Supabase dashboard")

# ─── 5. Dead Link Check ───────────────────────────────────────────────────────

header("5. DEAD LINKS — href targets vs. existing pages")

# Collect all existing page routes
existing_routes = set()
if APP_DIR.exists():
    for page in APP_DIR.rglob("page.tsx"):
        rel = page.parent.relative_to(APP_DIR)
        route = "/" + str(rel).replace("\\", "/")
        # Normalize dynamic segments
        route = re.sub(r"\[.*?\]", "[id]", route)
        existing_routes.add(route)
    existing_routes.add("/")

# Collect all href values in tsx/ts files
INTERNAL_HREF = re.compile(r'href=["\'](/[^"\'?#]*)["\']')
dead_links = {}

for tsx_file in SRC.rglob("*.tsx"):
    if "node_modules" in str(tsx_file):
        continue
    text = tsx_file.read_text(errors="ignore")
    for match in INTERNAL_HREF.finditer(text):
        href = match.group(1)
        # Normalize dynamic segments in href
        normalized = re.sub(r"/[0-9a-f-]{36}", "/[id]", href)
        normalized = re.sub(r"/\$\{[^}]+\}", "/[id]", normalized)
        # Skip external-ish paths
        if any(normalized.startswith(p) for p in ["/api/", "/_next/", "/static/"]):
            continue
        # Check if any existing route starts with this path
        base = normalized.rstrip("/") or "/"
        found = any(
            r == base or r.startswith(base + "/") or base.startswith(r.rstrip("/[id]"))
            for r in existing_routes
        )
        if not found:
            rel = str(tsx_file.relative_to(ROOT))
            if href not in dead_links:
                dead_links[href] = rel

if dead_links:
    for href, source in list(dead_links.items())[:20]:
        warn(f"Possible dead link: '{href}' (in {source})")
else:
    ok("No obvious dead links found")

# ─── 6. Agent Tool Wiring Check ───────────────────────────────────────────────

header("6. AGENT TOOL WIRING — Tool loop coverage")

CHAT_ROUTE = API_DIR / "agent" / "chat" / "route.ts"
AGENT_TOOL_REQUIREMENTS = {
    "ziro": ["assign_agent_task", "get_agent_reports", "audit_agent_output"],
    "sid": ["update_student", "search_students", "get_family", "update_family"],
    "star": ["update_lead", "search_leads", "send_email"],
    "bub": ["list_invoices", "get_invoice", "calculate_payroll", "analyze_bank_csv", "manage_expense", "offboard_student_billing", "access_payment_processor"],
    "stewie": ["generate_progress_report", "trigger_review_loop", "get_retention_health"],
    "vader": ["get_teacher", "update_teacher", "flesh_out_lesson_note", "check_teacher_compliance", "get_pedagogical_advice", "translate_parent_note"],
    "raven": ["queue_message", "get_communication_queue", "search_message_library", "get_communication_log"],
}

if CHAT_ROUTE.exists():
    chat_text = CHAT_ROUTE.read_text()
    for agent, tools in AGENT_TOOL_REQUIREMENTS.items():
        for tool in tools:
            if f'"{tool}"' in chat_text or f"'{tool}'" in chat_text:
                ok(f"{agent}.{tool} — wired")
            else:
                fail(f"{agent}.{tool} — NOT found in chat route")
else:
    fail(f"Agent chat route not found at {CHAT_ROUTE}")

# ─── Summary ──────────────────────────────────────────────────────────────────

header("AUDIT SUMMARY")
print(f"  Issues:   {len(issues)}")
print(f"  Warnings: {len(warnings)}")
print()

if issues:
    print("CRITICAL ISSUES (must fix before launch):")
    for i, issue in enumerate(issues, 1):
        print(f"  {i}. {issue}")
    print()

if warnings:
    print("WARNINGS (review before launch):")
    for i, w in enumerate(warnings, 1):
        print(f"  {i}. {w}")
    print()

if not issues and not warnings:
    print(f"  {PASS} All checks passed. Ready to launch.")
elif not issues:
    print(f"  {WARN} No critical issues. Review warnings above.")
else:
    print(f"  {FAIL} {len(issues)} critical issue(s) must be resolved before launch.")

sys.exit(1 if issues else 0)
