import { normalizeDate, normalizeEmail, normalizeMoney, normalizeName, normalizePhone, } from "./normalizers";
function parseRaw(raw) {
    if (raw === null || raw === undefined)
        return {};
    if (typeof raw === "object")
        return raw;
    if (typeof raw !== "string")
        return {};
    const trimmed = raw.trim();
    if (trimmed.length === 0)
        return {};
    try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            return parsed;
        }
    }
    catch (_a) {
        // fall through
    }
    return {};
}
function str(value) {
    if (typeof value !== "string")
        return null;
    const t = value.trim();
    return t.length > 0 ? t : null;
}
function strArray(value) {
    if (!Array.isArray(value))
        return [];
    return value
        .map((v) => (typeof v === "string" ? v.trim() : ""))
        .filter((v) => v.length > 0);
}
function pickFirst(obj, keys) {
    for (const k of keys) {
        if (k in obj && obj[k] !== undefined && obj[k] !== null)
            return obj[k];
    }
    return undefined;
}
function splitFullName(full) {
    if (!full)
        return { first_name: null, last_name: null };
    const parts = full.split(" ").filter((p) => p.length > 0);
    if (parts.length === 0)
        return { first_name: null, last_name: null };
    if (parts.length === 1)
        return { first_name: parts[0], last_name: null };
    return {
        first_name: parts[0],
        last_name: parts.slice(1).join(" "),
    };
}
export function validateLeadInput(raw) {
    var _a, _b, _c, _d, _e, _f;
    const obj = parseRaw(raw);
    const errors = [];
    const firstRaw = normalizeName(pickFirst(obj, ["first_name", "firstName"]));
    const lastRaw = normalizeName(pickFirst(obj, ["last_name", "lastName"]));
    const fullRaw = normalizeName(pickFirst(obj, ["name", "full_name", "fullName"]));
    let first_name = firstRaw;
    let last_name = lastRaw;
    let full_name = fullRaw;
    if (!first_name && full_name) {
        const split = splitFullName(full_name);
        first_name = split.first_name;
        if (!last_name)
            last_name = split.last_name;
    }
    if (!full_name) {
        const composed = [first_name, last_name].filter((p) => p).join(" ").trim();
        full_name = composed.length > 0 ? composed : null;
    }
    const email = normalizeEmail(pickFirst(obj, ["email"]));
    const phone = normalizePhone(pickFirst(obj, ["phone", "phone_number"]));
    const source = (_a = str(pickFirst(obj, ["source"]))) !== null && _a !== void 0 ? _a : null;
    const notes = (_b = str(pickFirst(obj, ["notes", "note"]))) !== null && _b !== void 0 ? _b : null;
    const tags = strArray(pickFirst(obj, ["tags"]));
    const stage = (_c = str(pickFirst(obj, ["stage"]))) !== null && _c !== void 0 ? _c : null;
    const assigned_to = (_d = str(pickFirst(obj, ["assigned_to", "assignedTo"]))) !== null && _d !== void 0 ? _d : null;
    const location_id = (_e = str(pickFirst(obj, ["location_id", "locationId"]))) !== null && _e !== void 0 ? _e : null;
    const metadata = (_f = (obj.metadata && typeof obj.metadata === "object"
        ? obj.metadata
        : {})) !== null && _f !== void 0 ? _f : {};
    if (!first_name)
        errors.push("first_name (or name) is required");
    if (!email && !phone)
        errors.push("email or phone is required");
    return {
        args: {
            full_name,
            first_name,
            last_name,
            email,
            phone,
            source,
            notes,
            tags,
            stage,
            assigned_to,
            location_id,
            metadata,
        },
        errors,
    };
}
function timeOnly(value) {
    if (typeof value !== "string")
        return null;
    const t = value.trim();
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(t)) {
        const [h, m, s] = t.split(":");
        const hh = h.padStart(2, "0");
        const mm = m.padStart(2, "0");
        const ss = (s !== null && s !== void 0 ? s : "00").padStart(2, "0");
        return `${hh}:${mm}:${ss}`;
    }
    return null;
}
function dateOnly(value) {
    const iso = normalizeDate(value);
    if (!iso)
        return null;
    return iso.slice(0, 10);
}
export function validateScheduleInput(raw) {
    var _a, _b, _c, _d, _e, _f, _g;
    const obj = parseRaw(raw);
    const errors = [];
    const teacher_id = (_a = str(pickFirst(obj, ["teacher_id", "teacherId"]))) !== null && _a !== void 0 ? _a : null;
    const student_id = (_b = str(pickFirst(obj, ["student_id", "studentId"]))) !== null && _b !== void 0 ? _b : null;
    const location_id = (_c = str(pickFirst(obj, ["location_id", "locationId"]))) !== null && _c !== void 0 ? _c : null;
    const room_id = (_d = str(pickFirst(obj, ["room_id", "roomId"]))) !== null && _d !== void 0 ? _d : null;
    const block_date = dateOnly(pickFirst(obj, ["block_date", "date", "day"]));
    const start_time = timeOnly(pickFirst(obj, ["start_time", "start", "startTime"]));
    const end_time = timeOnly(pickFirst(obj, ["end_time", "end", "endTime"]));
    const block_type = (_e = str(pickFirst(obj, ["block_type", "type", "blockType"]))) !== null && _e !== void 0 ? _e : null;
    const status = (_f = str(pickFirst(obj, ["status"]))) !== null && _f !== void 0 ? _f : null;
    const notes = (_g = str(pickFirst(obj, ["notes", "note"]))) !== null && _g !== void 0 ? _g : null;
    if (!teacher_id)
        errors.push("teacher_id is required");
    if (!location_id)
        errors.push("location_id is required");
    if (!block_date)
        errors.push("block_date is required");
    if (!start_time)
        errors.push("start_time is required");
    if (!end_time)
        errors.push("end_time is required");
    if (start_time && end_time && start_time >= end_time)
        errors.push("start_time must be before end_time");
    return {
        args: {
            teacher_id,
            student_id,
            location_id,
            room_id,
            block_date,
            start_time,
            end_time,
            block_type,
            status,
            notes,
        },
        errors,
    };
}
export function validateInvoiceInput(raw) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const obj = parseRaw(raw);
    const errors = [];
    const customer_id = (_a = str(pickFirst(obj, ["customer_id", "customerId"]))) !== null && _a !== void 0 ? _a : null;
    const family_id = (_b = str(pickFirst(obj, ["family_id", "familyId"]))) !== null && _b !== void 0 ? _b : null;
    const student_id = (_c = str(pickFirst(obj, ["student_id", "studentId"]))) !== null && _c !== void 0 ? _c : null;
    const money = normalizeMoney(pickFirst(obj, ["amount", "amount_cents", "total", "money"]));
    const due = normalizeDate(pickFirst(obj, ["due_date", "dueDate", "due"]));
    const description = (_d = str(pickFirst(obj, ["description", "memo", "note"]))) !== null && _d !== void 0 ? _d : null;
    const invoice_number = (_e = str(pickFirst(obj, ["invoice_number", "invoiceNumber", "number"]))) !== null && _e !== void 0 ? _e : null;
    const metadata = (_f = (obj.metadata && typeof obj.metadata === "object"
        ? obj.metadata
        : {})) !== null && _f !== void 0 ? _f : {};
    if (!customer_id && !family_id && !student_id)
        errors.push("customer_id, family_id, or student_id is required");
    if (!money)
        errors.push("amount is required and must be numeric");
    else if (money.amountCents <= 0)
        errors.push("amount must be greater than zero");
    return {
        args: {
            customer_id,
            family_id,
            student_id,
            amount_cents: (_g = money === null || money === void 0 ? void 0 : money.amountCents) !== null && _g !== void 0 ? _g : null,
            currency: (_h = money === null || money === void 0 ? void 0 : money.currency) !== null && _h !== void 0 ? _h : "USD",
            due_date: due ? due.slice(0, 10) : null,
            description,
            invoice_number,
            metadata,
        },
        errors,
    };
}
export function validateMessageInput(raw) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const obj = parseRaw(raw);
    const errors = [];
    const audienceRaw = str(pickFirst(obj, ["audience", "to_type", "recipient_type"]));
    const audience = audienceRaw === "family" ||
        audienceRaw === "teacher" ||
        audienceRaw === "student"
        ? audienceRaw
        : null;
    const recipient_id = (_a = str(pickFirst(obj, ["recipient_id", "to", "to_id"]))) !== null && _a !== void 0 ? _a : null;
    const family_id = (_b = str(pickFirst(obj, ["family_id", "familyId"]))) !== null && _b !== void 0 ? _b : null;
    const student_id = (_c = str(pickFirst(obj, ["student_id", "studentId"]))) !== null && _c !== void 0 ? _c : null;
    const teacher_id = (_d = str(pickFirst(obj, ["teacher_id", "teacherId"]))) !== null && _d !== void 0 ? _d : null;
    const channel = ((_e = str(pickFirst(obj, ["channel"]))) !== null && _e !== void 0 ? _e : "email").toLowerCase();
    const subject = (_f = str(pickFirst(obj, ["subject", "title"]))) !== null && _f !== void 0 ? _f : null;
    const body = (_g = str(pickFirst(obj, ["body", "message", "content", "text"]))) !== null && _g !== void 0 ? _g : null;
    const metadata = (_h = (obj.metadata && typeof obj.metadata === "object"
        ? obj.metadata
        : {})) !== null && _h !== void 0 ? _h : {};
    if (!body)
        errors.push("body is required");
    if (!audience && !family_id && !student_id && !teacher_id && !recipient_id)
        errors.push("audience or a recipient id is required");
    if (!["email", "sms", "push", "in_app"].includes(channel))
        errors.push(`channel "${channel}" is not supported`);
    return {
        args: {
            audience,
            recipient_id,
            family_id,
            student_id,
            teacher_id,
            channel,
            subject,
            body,
            metadata,
        },
        errors,
    };
}
export function validateFollowupInput(raw) {
    var _a, _b, _c, _d, _e, _f, _g;
    const obj = parseRaw(raw);
    const errors = [];
    const student_id = (_a = str(pickFirst(obj, ["student_id", "studentId"]))) !== null && _a !== void 0 ? _a : null;
    const family_id = (_b = str(pickFirst(obj, ["family_id", "familyId"]))) !== null && _b !== void 0 ? _b : null;
    const followup_date = dateOnly(pickFirst(obj, ["followup_date", "date", "due_date", "when"]));
    const reason = (_c = str(pickFirst(obj, ["reason", "category"]))) !== null && _c !== void 0 ? _c : null;
    const status = (_e = (_d = str(pickFirst(obj, ["status"]))) === null || _d === void 0 ? void 0 : _d.toLowerCase()) !== null && _e !== void 0 ? _e : "pending";
    const notes = (_f = str(pickFirst(obj, ["notes", "note", "body"]))) !== null && _f !== void 0 ? _f : null;
    const assigned_to = (_g = str(pickFirst(obj, ["assigned_to", "assignedTo"]))) !== null && _g !== void 0 ? _g : null;
    if (!student_id)
        errors.push("student_id is required");
    if (!family_id)
        errors.push("family_id is required");
    if (!followup_date)
        errors.push("followup_date is required");
    if (!reason)
        errors.push("reason is required");
    return {
        args: {
            student_id,
            family_id,
            followup_date,
            reason,
            status,
            notes,
            assigned_to,
        },
        errors,
    };
}
