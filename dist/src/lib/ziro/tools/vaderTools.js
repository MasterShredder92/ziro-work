import { createStudentFollowup } from "@data/studentFollowups";
import { createTask } from "@data/tasks";
import { validateMessageInput } from "./validators";
function requireTenant(input) {
    if (!input.tenantId || input.tenantId.trim().length === 0) {
        throw new Error("tenantId is required");
    }
    return input.tenantId;
}
function truncate(value, max) {
    return value.length <= max ? value : `${value.slice(0, max - 3)}...`;
}
function todayIso() {
    return new Date().toISOString().slice(0, 10);
}
function followupFromMessage(args, reason, createdBy) {
    var _a, _b;
    if (!args.student_id || !args.family_id)
        return null;
    const bodyBlock = `[${args.channel.toUpperCase()}] ${(_a = args.subject) !== null && _a !== void 0 ? _a : ""}`.trim();
    const notes = [bodyBlock, (_b = args.body) !== null && _b !== void 0 ? _b : ""].filter((v) => v.length > 0).join("\n");
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
function messageTask(args, audience, recipientId) {
    var _a;
    const title = truncate((_a = args.subject) !== null && _a !== void 0 ? _a : `Send ${audience} ${args.channel} message`, 180);
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
async function dispatchMessage(input, audience) {
    var _a, _b, _c, _d, _e, _f;
    const tenantId = requireTenant(input);
    const { args, errors } = validateMessageInput((_a = input.args) !== null && _a !== void 0 ? _a : input.raw);
    const merged = Object.assign(Object.assign({}, args), { audience: (_b = args.audience) !== null && _b !== void 0 ? _b : audience });
    const recipientId = audience === "family"
        ? (_c = merged.family_id) !== null && _c !== void 0 ? _c : merged.recipient_id
        : audience === "teacher"
            ? (_d = merged.teacher_id) !== null && _d !== void 0 ? _d : merged.recipient_id
            : (_e = merged.student_id) !== null && _e !== void 0 ? _e : merged.recipient_id;
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
    const profileId = (_f = input.profileId) !== null && _f !== void 0 ? _f : null;
    if (audience === "student" || audience === "family") {
        const followupArgs = Object.assign(Object.assign({}, merged), { student_id: audience === "student"
                ? recipientId
                : merged.student_id, family_id: audience === "family"
                ? recipientId
                : merged.family_id });
        const followupInsert = followupFromMessage(followupArgs, `${audience}_message`, profileId);
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
    const task = await createTask(tenantId, messageTask(merged, audience, recipientId));
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
export const sendFamilyMessageTool = {
    name: "sendFamilyMessage",
    description: "Queue a message for a family. Persists as a student_followup when student context is present, otherwise as an agent_message task.",
    handler: (input) => dispatchMessage(input, "family"),
};
export const sendTeacherMessageTool = {
    name: "sendTeacherMessage",
    description: "Queue a message for a teacher. Persists as an agent_message task scoped to the teacher entity.",
    handler: (input) => dispatchMessage(input, "teacher"),
};
export const sendStudentMessageTool = {
    name: "sendStudentMessage",
    description: "Queue a message for a student. Persists as a student_followup record scoped to the student's family.",
    handler: (input) => dispatchMessage(input, "student"),
};
