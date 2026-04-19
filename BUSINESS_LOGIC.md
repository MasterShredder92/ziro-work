# ZiroWork — Core Business Logic

> This document is the single source of truth for all scheduling, billing, payroll, and enrollment rules.
> Every agent, component, and developer MUST follow these rules exactly.

---

## 1. The Studio

**Adkins Music Lessons** operates four locations in Nebraska:
- **Bellevue** (color: `#7C3AED` — purple)
- **Gretna** (color: `#16A34A` — green)
- **Elkhorn** (color: `#0EA5E9` — light blue)
- **Omaha** (color: `#DC2626` — red)

---

## 2. The Lesson Block

Everything is priced and tracked in **half-hour blocks**.

- One half-hour lesson = **1 block**
- A student who takes a 1-hour lesson = **2 blocks**
- Teachers are paid per block. Students are billed per block.
- There is no other unit of time. Everything is a block.

---

## 3. Family Billing Rates

Invoices are issued to **families**, not individual students. The per-block rate depends on the number of students in the family:

| Students in Family | Rate per Block |
|--------------------|----------------|
| 1 student          | $45.00         |
| 2 students         | $40.00         |
| Military (1 student) | $40.00       |
| 4+ students        | $37.50         |

Monthly invoice = `(Total blocks for all students that month) × (family rate)`

### Proration
If a student's **First Day** falls mid-month, the first invoice is prorated:
- Count only the blocks from First Day through end of that calendar month
- Starting the following month, full monthly billing begins

---

## 4. Schedule Block Types & Colors

Every lesson slot on the schedule has a type. The type controls color, billing, payroll, and automation.

| Type | Color | Hex | Billable to Family | Teacher Tally |
|------|-------|-----|-------------------|---------------|
| Booked | Yellow | `#EAB308` | Yes | Yes |
| First Day | Light Blue | `#38BDF8` | Yes (prorated) | Yes |
| Last Day | Red | `#EF4444` | Yes | Yes |
| Call Out | Orange | `#F97316` | No | No |
| Makeup Session | Pink | `#EC4899` | No | No |
| Meet & Greet | Pink | `#EC4899` | No | Yes |
| Sub | Green | `#22C55E` | Yes | Yes (sub teacher) |
| Training | Purple | `#A855F7` | No | No |
| Locked Times | Gray | `#6B7280` | No | No |

---

## 5. Schedule Type Automation Rules

### Booked (Yellow)
- Standard recurring lesson. Repeats every week on the same day/time indefinitely.
- No special triggers.

### First Day (Light Blue)
- **Triggers on save:**
  1. Creates the Family record (if not already created)
  2. Creates the Student record under that family
  3. Sets the student status to `active`
  4. Calculates and creates the first (prorated) invoice for the current month
  5. Sets up recurring monthly invoices starting the 1st of the following month
  6. The next week, the slot automatically converts to `Booked` (recurring)
- Teachers can click into a First Day block to see student intake notes (NO contact info — no phone, no email)

### Last Day (Red)
- **Triggers on the day it occurs:**
  1. Cancels all future recurring invoices for this family (if no other active students remain)
  2. Sets the student status to `inactive` after this date
  3. Removes the student from the recurring schedule going forward
  4. The time slot becomes an **open/available** slot for that teacher starting the following week

### Call Out (Orange)
- Student canceled the lesson.
- **Triggers:**
  1. Deducts 1 from the student's `callout_bank` (max 4 per calendar year, resets Jan 1)
  2. Teacher does NOT get a tally for this block
  3. Family is NOT billed for this block
  4. The time slot becomes **open/available** for that teacher on that specific day
  5. App notifies the student/parent: remaining bank count + whether a 5th-week makeup is available
- Students call out via the parent-facing app. They select a reason (illness, scheduling conflict, other).

### Makeup Session (Pink)
- Fulfills a previously banked Call Out using a 5th-week slot.
- Teacher does NOT get a tally (it's a makeup, not a new lesson)
- Family is NOT billed
- The block is visually marked pink and labeled "Makeup for [original date]"

### Meet & Greet (Pink)
- A prospective student coming in for a trial lesson. They are in the **Lead** stage, not yet a student.
- Teacher DOES get a tally for this block
- Family is NOT billed
- Tracked in the CRM lead pipeline. If they enroll, their status changes from Lead → Student and a First Day is booked.

### Sub (Green)
- The original teacher called out. Their students are reassigned to a substitute teacher.
- **Triggers:**
  1. All of the calling-out teacher's blocks for that day are removed from their schedule
  2. Those blocks are moved to the sub teacher's schedule, marked as `Sub`
  3. The **sub teacher** gets the tally for each block
  4. The **original teacher** gets NO tally for those blocks
  5. Family IS billed normally (the lesson happened)

### Training (Purple)
- Internal teacher training session.
- Teacher does NOT get a tally
- Family is NOT billed

---

## 6. The Fifth-Week Makeup Bank

This is the core makeup lesson policy. There are no ad-hoc makeup reschedules.

### The Bank
- Every student starts January 1 with **4 call-out credits** in their `callout_bank`
- The bank resets to 4 every January 1, regardless of how many were used
- The bank is **per student**, not per family

### The Fifth-Week Rule
- Months that have a 5th occurrence of a student's lesson day are called **fifth-week months**
- The studio does NOT charge families for 5th-week lessons
- Teachers do NOT get paid for 5th-week lessons
- 5th-week slots are automatically designated as **Makeup Session** slots

### The Logic Flow
1. Student calls out → `callout_bank` decreases by 1
2. App checks: does the current month have a 5th week for this student?
   - **Yes:** "This month has a 5th week — that's your makeup lesson. No charge, no rescheduling needed."
   - **No:** "Got it. Your next 5th-week month is [month]. That will be your makeup lesson."
3. The 5th-week slot is automatically marked as `Makeup Session` (pink) for that student
4. If a student does NOT call out and a 5th week occurs, they have **banked** a credit — their `callout_bank` stays at 4 but they've effectively gotten a free lesson that month. The bank doesn't go above 4.

---

## 7. Teacher Payroll (The Tally)

Teachers are paid per block at a rate set in their contract ($15, $16, or $17 per block).

### Tally Rules
| Block Type | Counts Toward Tally? |
|------------|----------------------|
| Booked | ✅ Yes |
| First Day | ✅ Yes |
| Last Day | ✅ Yes |
| Meet & Greet | ✅ Yes |
| Sub (as the sub) | ✅ Yes |
| Call Out | ❌ No |
| Makeup Session | ❌ No |
| Training | ❌ No |
| Sub (as the original teacher) | ❌ No |

### Monthly Payroll Calculation
`Teacher Pay = (Total Tallied Blocks for the month) × (Teacher's per-block rate)`

---

## 8. Student Lifecycle States

```
Lead → Meet & Greet → Active Student → Inactive (Last Day)
```

| State | Description |
|-------|-------------|
| `lead` | Prospective student, in CRM pipeline |
| `meet_greet` | Scheduled for a trial lesson |
| `active` | Enrolled, has recurring schedule and billing |
| `inactive` | Quit or paused, no billing, no schedule |

---

## 9. Data Ownership Rules

- **Families** are the billing unit. All invoices belong to a family.
- **Students** are the roster unit. Each student belongs to exactly one family.
- **Teachers** never see family contact information (no phone, no email). They only see student first name, instrument, and teacher notes.
- **Owners and Admins** see everything.
- **Studio Directors** see their location only.
- **Co-Directors** see all locations but cannot modify billing settings.

---

## 10. Tenant ID

All data for Adkins Music Lessons is under tenant ID:
```
00000000-0000-0000-0000-000000000001
```

---

*Last updated: April 2026*
