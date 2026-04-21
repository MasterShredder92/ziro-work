# 🐦 Raven: Senior Operator of Communications

Raven is the **sole brand voice** for ZiroWork. She doesn't just "send messages"; she orchestrates, batches, and filters all communication to ensure zero parent spam and perfect tone matching.

## 1. Database Ecosystem
Raven pulls from and writes to these core Supabase tables:

| Table Name | Raven's Role | Why She Pulls From It |
| :--- | :--- | :--- |
| `message_library` | **The DNA** | Matches current situations to your 100K curated messages. |
| `communication_queue` | **The Inbox** | Holds pending requests from other agents (Sid, Ruby, etc.). |
| `communication_log` | **The Memory** | Audits what was sent, when, and to whom to prevent repeats. |
| `families` | **The Recipient** | Pulls primary contact info (Email/Phone) for parents. |
| `students` | **The Context** | Pulls student names, instruments, and goals for personalization. |
| `teachers` | **The Source** | Identifies which teacher a message is "from" or about. |

---

## 2. Recipient Categories
Raven is authorized to contact these specific groups:

*   **Parents / Families**: The primary billing and logistics contact.
*   **Students**: Direct communication for older students (if permitted).
*   **Teachers**: Internal coordination, sub requests, and schedule alerts.
*   **Leads**: Prospective students in the enrollment pipeline (handled by Star, sent by Raven).

---

## 3. Message Labels & Categories
When organizing your 100K messages, use these labels so Raven can find them instantly:

### **Situations (The "Why")**
*   `lesson_moved`: Rescheduling notifications.
*   `payment_overdue`: Billing reminders.
*   `first_lesson_scheduled`: Welcome/Onboarding.
*   `missed_lesson`: Attendance alerts.
*   `progress_update`: Positive student feedback.
*   `sub_alert`: Teacher substitution notification.

### **Tones (The "How")**
*   `friendly`: Standard upbeat studio voice.
*   `professional`: Formal business matters.
*   `urgent`: Immediate action required (e.g., call-outs).
*   `celebratory`: Achievements, birthdays, milestones.
*   `apologetic`: Schedule errors or service issues.

---

## 4. The "Senior Operator" Logic
Raven follows these three rules for every message:

1.  **The Batch Rule**: If a family has 3 updates (e.g., a move, a payment, and a note), Raven waits 5 minutes to see if more arrive, then sends **one** combined message.
2.  **The Tone Match**: She searches the `message_library` for the `situation` + `tone` and adapts the body to match your exact phrasing.
3.  **The Priority Filter**: 
    *   **Urgent**: Sends immediately (SMS + Email).
    *   **Routine**: Batches for 5-15 minutes.
    *   **Digest**: Sends as a daily summary.

---

## 5. What to add to your MD file
To make the library ingestion seamless, ensure your messages have:
- `situation`: (e.g., `missed_lesson`)
- `tone`: (e.g., `friendly`)
- `body`: The actual text with placeholders like `{{student_name}}` or `{{teacher_name}}`.
