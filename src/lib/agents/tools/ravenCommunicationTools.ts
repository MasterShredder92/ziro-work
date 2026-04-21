/**
 * Raven's Communication Tools
 * Queue, batch, and send messages through the communication hub
 */

export const RAVEN_TOOLS = [
  {
    name: "queue_message",
    description: "Queue a communication request to be sent to a parent/family. Other agents use this to hand off their communication needs to Raven.",
    input_schema: {
      type: "object",
      properties: {
        recipient_id: {
          type: "string",
          description: "UUID of the family, student, or teacher receiving the message",
        },
        recipient_type: {
          type: "string",
          enum: ["parent", "family", "student", "teacher"],
          description: "Type of recipient",
        },
        recipient_email: {
          type: "string",
          description: "Email address (if sending email)",
        },
        recipient_phone: {
          type: "string",
          description: "Phone number (if sending SMS)",
        },
        message_type: {
          type: "string",
          enum: ["text", "email", "in_app"],
          description: "How to send the message",
        },
        priority: {
          type: "string",
          enum: ["urgent", "routine", "digest"],
          description: "Priority level. Urgent sends immediately. Routine batches. Digest waits until end of day.",
        },
        subject: {
          type: "string",
          description: "Subject line (for emails only)",
        },
        body: {
          type: "string",
          description: "The message body (will be spruced up by Raven to match brand voice)",
        },
        context: {
          type: "object",
          description: "Event context (student name, lesson details, etc.) to help Raven compose the message",
        },
        from_agent: {
          type: "string",
          enum: ["sid", "ruby", "star", "stewie", "vader", "bub"],
          description: "Which agent is requesting this communication",
        },
      },
      required: ["recipient_id", "recipient_type", "message_type", "priority", "body", "from_agent"],
    },
  },
  {
    name: "get_communication_queue",
    description: "Retrieve all queued messages waiting to be sent, optionally filtered by status, priority, or recipient",
    input_schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["queued", "batched", "sent", "failed"],
          description: "Filter by status",
        },
        priority: {
          type: "string",
          enum: ["urgent", "routine", "digest"],
          description: "Filter by priority",
        },
        recipient_id: {
          type: "string",
          description: "Filter by specific recipient",
        },
        limit: {
          type: "number",
          description: "Max number of messages to return (default 50)",
        },
      },
      required: [],
    },
  },
  {
    name: "batch_and_send",
    description: "Compile queued messages for a recipient into one cohesive message and send it. Raven decides the best way to combine them.",
    input_schema: {
      type: "object",
      properties: {
        recipient_id: {
          type: "string",
          description: "UUID of the recipient to batch messages for",
        },
        recipient_type: {
          type: "string",
          enum: ["parent", "family", "student", "teacher"],
          description: "Type of recipient",
        },
        message_type: {
          type: "string",
          enum: ["text", "email", "in_app"],
          description: "How to send the compiled message",
        },
        max_wait_seconds: {
          type: "number",
          description: "Wait up to this many seconds for more messages to arrive before sending (default 300)",
        },
      },
      required: ["recipient_id", "recipient_type", "message_type"],
    },
  },
  {
    name: "search_message_library",
    description: "Search Raven's 100K message library to find the perfect phrasing for a situation. Returns the best matches with their tone and context.",
    input_schema: {
      type: "object",
      properties: {
        situation: {
          type: "string",
          description: "The situation (e.g., 'lesson_moved', 'payment_overdue', 'first_lesson_scheduled')",
        },
        tone: {
          type: "string",
          enum: ["friendly", "professional", "urgent", "celebratory", "apologetic"],
          description: "The tone you want",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Tags to filter by (e.g., ['parent', 'student', 'urgent'])",
        },
        limit: {
          type: "number",
          description: "Max number of matches to return (default 5)",
        },
      },
      required: ["situation"],
    },
  },
  {
    name: "get_communication_log",
    description: "View the audit trail of sent communications. See what was sent, when, to whom, and which agents were involved.",
    input_schema: {
      type: "object",
      properties: {
        recipient_id: {
          type: "string",
          description: "Filter by recipient",
        },
        start_date: {
          type: "string",
          description: "Start date (ISO format)",
        },
        end_date: {
          type: "string",
          description: "End date (ISO format)",
        },
        limit: {
          type: "number",
          description: "Max number of logs to return (default 50)",
        },
      },
      required: [],
    },
  },
];
