export function mapThreadChannel(ct) {
    if (ct === "email")
        return "email";
    if (ct === "sms")
        return "sms";
    return "internal";
}
function initialsFromName(name) {
    var _a, _b;
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0)
        return "?";
    if (parts.length === 1) {
        const w = parts[0];
        return w.length === 1 ? w.toUpperCase() : w.slice(0, 2).toUpperCase();
    }
    const a = (_a = parts[0][0]) !== null && _a !== void 0 ? _a : "";
    const b = (_b = parts[parts.length - 1][0]) !== null && _b !== void 0 ? _b : "";
    return `${a}${b}`.toUpperCase();
}
function firstToken(name) {
    const t = name.trim().split(/\s+/)[0];
    return t && t.length > 0 ? t : name.trim() || "Member";
}
function mapRoleBadge(displayRole, displayName) {
    const n = (displayRole !== null && displayRole !== void 0 ? displayRole : "").toLowerCase();
    const nm = displayName.toLowerCase();
    if (nm === "system" || nm.startsWith("system "))
        return "system";
    if (n.includes("student"))
        return "student";
    if (n.includes("parent") ||
        n.includes("guardian") ||
        n.includes("family") ||
        n.includes("mother") ||
        n.includes("father")) {
        return "family";
    }
    if (n.includes("teacher") || n.includes("instructor"))
        return "teacher";
    return "staff";
}
function formatThreadRole(role) {
    switch (role) {
        case "owner":
            return "Owner";
        case "member":
            return "Member";
        case "cc":
            return "CC";
        case "bcc":
            return "BCC";
        case "observer":
            return "Observer";
        default:
            return role;
    }
}
function formatRelativeTime(iso) {
    const t = new Date(iso).getTime();
    if (!Number.isFinite(t))
        return "just now";
    const deltaMs = Date.now() - t;
    const absMs = Math.abs(deltaMs);
    const suffix = deltaMs >= 0 ? "ago" : "from now";
    if (absMs < 60000)
        return "just now";
    if (absMs < 3600000)
        return `${Math.round(absMs / 60000)}m ${suffix}`;
    if (absMs < 86400000)
        return `${Math.round(absMs / 3600000)}h ${suffix}`;
    return `${Math.round(absMs / 86400000)}d ${suffix}`;
}
function readLastActiveAt(p) {
    var _a, _b, _c, _d, _e;
    const ext = p;
    const raw = (_e = (_d = (_c = (_a = ext.lastActiveAt) !== null && _a !== void 0 ? _a : (_b = ext.display) === null || _b === void 0 ? void 0 : _b.lastActiveAt) !== null && _c !== void 0 ? _c : p.lastReadAt) !== null && _d !== void 0 ? _d : p.joinedAt) !== null && _e !== void 0 ? _e : null;
    return typeof raw === "string" && raw.trim() ? raw : null;
}
function isActiveNow(lastActiveAt) {
    if (!lastActiveAt)
        return false;
    const t = new Date(lastActiveAt).getTime();
    if (!Number.isFinite(t))
        return false;
    return Math.abs(Date.now() - t) <= 5 * 60000;
}
function memberRoleBadge(participant, profileRole) {
    if (participant.role === "owner")
        return "Owner";
    const role = (profileRole !== null && profileRole !== void 0 ? profileRole : "").toLowerCase();
    if (role.includes("admin") ||
        role.includes("director") ||
        role.includes("staff")) {
        return "Admin";
    }
    return "Member";
}
function buildRelationships(p, contextType, threadSubject) {
    const lines = [];
    if (p.role === "owner")
        lines.push("Conversation owner");
    else if (p.role === "observer")
        lines.push("Read-only observer");
    else if (p.role === "cc")
        lines.push("Copied on thread");
    else if (p.role === "bcc")
        lines.push("Blind-copied on thread");
    if (contextType === null || contextType === void 0 ? void 0 : contextType.trim()) {
        const sub = threadSubject === null || threadSubject === void 0 ? void 0 : threadSubject.trim();
        lines.push(sub
            ? `Context (${contextType}): ${sub}`
            : `Linked context: ${contextType}`);
    }
    return lines;
}
export function deriveThreadParticipants(participants, threadChannel, contextType, threadSubject) {
    const channel = mapThreadChannel(threadChannel);
    return participants.map((p) => {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const name = ((_b = (_a = p.display) === null || _a === void 0 ? void 0 : _a.fullName) !== null && _b !== void 0 ? _b : "").trim() || p.profileId.slice(0, 8);
        const lastActiveAt = readLastActiveAt(p);
        const activeNow = isActiveNow(lastActiveAt);
        const profileRole = (_d = (_c = p.display) === null || _c === void 0 ? void 0 : _c.role) !== null && _d !== void 0 ? _d : null;
        const memberBadge = memberRoleBadge(p, profileRole);
        return {
            id: p.id,
            profileId: p.profileId,
            name,
            roleBadge: mapRoleBadge((_f = (_e = p.display) === null || _e === void 0 ? void 0 : _e.role) !== null && _f !== void 0 ? _f : null, name),
            threadRole: p.role,
            threadRoleLabel: formatThreadRole(p.role),
            profileRole,
            channel,
            relationships: buildRelationships(p, contextType, threadSubject),
            initials: initialsFromName(name),
            avatarUrl: (_h = (_g = p.display) === null || _g === void 0 ? void 0 : _g.avatarUrl) !== null && _h !== void 0 ? _h : null,
            memberRoleBadge: memberBadge,
            lastActiveAt,
            activeNow,
            presenceTooltip: activeNow
                ? "Active now"
                : `Last seen ${lastActiveAt ? formatRelativeTime(lastActiveAt) : "unknown"}`,
        };
    });
}
export function collapsedNamePreview(rows, limit = 6) {
    return rows
        .slice(0, limit)
        .map((r) => firstToken(r.name))
        .join(", ");
}
