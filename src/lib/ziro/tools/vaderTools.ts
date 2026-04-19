import { createStudentFollowup } from "@data/studentFollowups";
import { createTask } from "@data/tasks";
import type {
  StudentFollowupInsert,
  TaskInsert,
} from "@/lib/types/entities";
import type { ToolDefinition, ToolInput, ToolOutput } from "./types";
import { validateMessageInput, type MessageArgs } from "./validators";

function requireTenant(input: ToolInput): string {
  if (!input.tenantId || input.tenantId.trim().length === 0) {
    throw new Error("tenantId is required");
  }
  return input.tenantId;
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 3)}...`;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function followupFromMessage(
  args: MessageArgs,
  reason: string,
  createdBy: string | null,
): Omit<StudentFollowupInsert, "tenant_id"> | null {
  if (!args.student_id || !args.family_id) return null;
  const bodyBlock = `[${args.channel.toUpperCase()}] ${args.subject ?? ""}`.trim();
  const notes = [bodyBlock, args.body ?? ""].filter((v) => v.length > 0).join("\n");
  return {
    student_id: args.student_id,
    family_id: args.family_id,
    followup_date: todayIso(),
    reason,
    status: "pending",
    notes: notes.length > 0 ? notes : null,
    ai_draft: args.body,
    created_by: createdBy,
  };
}

function messageTask(
  args: MessageArgs,
  audience: "family" | "teacher" | "student",
  recipientId: string,
): Omit<TaskInsert, "tenant_id"> {
  const title = truncate(
    args.subject ?? `Send ${audience} ${args.channel} message`,
    180,
  );
  return {
    task_type: "agent_message",
    title,
    description: args.body,
    status: "pending",
    priority: "normal",
    entity_type: audience,
    entity_id: recipientId,
    assigned_role: audience,
    assigned_to: recipientId,
  };
}

async function dispatchMessage(
  input: ToolInput,
  audience: "family" | "teacher" | "student",
): Promise<ToolOutput> {
  const tenantId = requireTenant(input);
  const { args, errors } = validateMessageInput(input.args ?? input.raw);

  const merged: MessageArgs = {
    ...args,
    audience: args.audience ?? audience,
  };

  const recipientId =
    audience === "family"
      ? merged.family_id ?? merged.recipient_id
      : audience === "teacher"
        ? merged.teacher_id ?? merged.recipient_id
        : merged.student_id ?? merged.recipient_id;

  const missingRecipient = !recipientId;
  const allErrors = [...errors];
  if (missingRecipient)
    allErrors.push(`${audience}_id or recipient_id is required`);

  if (allErrors.length > 0) {
    return {
      result: { ok: false, errors: allErrors },
      metadata: { validation_failed: true },
    };
  }

  const profileId = input.profileId ?? null;

  if (audience === "student" || audience === "family") {
    const followupArgs: MessageArgs = {
      ...merged,
      student_id:
        audience === "student"
          ? (recipientId as string)
          : merged.student_id,
      family_id:
        audience === "family"
          ? (recipientId as string)
          : merged.family_id,
    };

    const followupInsert = followupFromMessage(
      followupArgs,
      `${audience}_message`,
      profileId,
    );

    if (followupInsert) {
      const followup = await createStudentFollowup(tenantId, followupInsert);
      return {
        result: {
          ok: true,
          audience,
          channel: merged.channel,
          followup,
        },
        metadata: {
          entity: "student_followup",
          action: "send_message",
          audience,
          followup_id: followup.id,
        },
      };
    }
  }

  const task = await createTask(
    tenantId,
    messageTask(merged, audience, recipientId as string),
  );

  return {
    result: {
      ok: true,
      audience,
      channel: merged.channel,
      task,
    },
    metadata: {
      entity: "task",
      action: "send_message",
      audience,
      task_id: task.id,
    },
  };
}

export const sendFamilyMessageTool: ToolDefinition = {
  name: "sendFamilyMessage",
  description:
    "Queue a message for a family. Persists as a student_followup when student context is present, otherwise as an agent_message task.",
  handler: (input: ToolInput): Promise<ToolOutput> =>
    dispatchMessage(input, "family"),
};

export const sendTeacherMessageTool: ToolDefinition = {
  name: "sendTeacherMessage",
  description:
    "Queue a message for a teacher. Persists as an agent_message task scoped to the teacher entity.",
  handler: (input: ToolInput): Promise<ToolOutput> =>
    dispatchMessage(input, "teacher"),
};

export const sendStudentMessageTool: ToolDefinition = {
  name: "sendStudentMessage",
  description:
    "Queue a message for a student. Persists as a student_followup record scoped to the student's family.",
  handler: (input: ToolInput): Promise<ToolOutput> =>
    dispatchMessage(input, "student"),
};
