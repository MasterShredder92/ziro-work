# Z-IQ: Ziro Intelligence Agentic OS

Z-IQ is the intelligence layer of ZiroWork, transforming it from a CRM into an Agentic Operating System. It follows the **Domain -> Skill -> Automation** framework with a 3-tier memory vault.

## 1. Domains & Skills

Operations are divided into high-level domains, each containing specific executable skills.

### Domain: Growth & Sales
- **Skill: Lead Scorer** - Analyzes incoming leads and scores them based on historical conversion data.
- **Skill: Outreach Bot** - Drafts personalized SMS/Email outreach for new leads.
- **Skill: Conversion Audit** - Audits the sales funnel for leaks and friction points.

### Domain: Studio Operations
- **Skill: Smart Matcher** - Connects students to the perfect teacher based on instrument, location, and personality.
- **Skill: Capacity Optimizer** - Identifies revenue gaps in room/teacher schedules.
- **Skill: Policy Enforcer** - Flags students/families who are out of compliance with studio policies.

### Domain: Financial Intelligence
- **Skill: Revenue Forecaster** - Predicts next month's revenue based on current student retention and lead velocity.
- **Skill: Collections Agent** - Automates follow-ups for overdue invoices.
- **Skill: Payroll Auditor** - Verifies teacher pay rates against actual lessons taught.

---

## 2. Ziro Vault (3-Tier Memory)

Located at `src/lib/z-iq/vault/`:

1.  **Raw (`/raw`)**: Landing ground for all research, transcripts, and unstructured data.
2.  **Wiki (`/wiki`)**: Structured reports, standardized processes, and "Golden Records".
3.  **Outputs (`/outputs`)**: Final deliverables, drafted messages, and shared assets.

---

## 3. Observability & Control

The **Command Center** dashboard features one-click agent buttons to trigger these skills. Every action is audited and logged in the system.
