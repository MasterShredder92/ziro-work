// Signature engine — request lifecycle, signer workflow, audit trail.
function nowIso() {
    return new Date().toISOString();
}
function uuid() {
    const c = globalThis.crypto;
    if (c === null || c === void 0 ? void 0 : c.randomUUID)
        return c.randomUUID();
    return `sigx_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}
function signerToken() {
    return uuid().replace(/-/g, "").slice(0, 40);
}
export function buildSignatureRequest({ tenantId, input, ip, userAgent, }) {
    var _a, _b, _c, _d, _e, _f;
    const id = uuid();
    const signers = ((_a = input.signers) !== null && _a !== void 0 ? _a : []).map((s, idx) => {
        var _a, _b;
        return ({
            id: (_a = s.id) !== null && _a !== void 0 ? _a : uuid(),
            name: s.name,
            email: s.email,
            profileId: (_b = s.profileId) !== null && _b !== void 0 ? _b : null,
            order: typeof s.order === "number" ? s.order : idx,
            status: "pending",
            viewedAt: null,
            signedAt: null,
            ip: null,
            userAgent: null,
            token: signerToken(),
        });
    });
    const fields = ((_b = input.fields) !== null && _b !== void 0 ? _b : []).map((f) => {
        var _a;
        return ({
            id: (_a = f.id) !== null && _a !== void 0 ? _a : uuid(),
            type: f.type,
            label: f.label,
            page: f.page,
            x: f.x,
            y: f.y,
            width: f.width,
            height: f.height,
            rotation: f.rotation,
            required: f.required,
            value: null,
            signedAt: null,
        });
    });
    const now = nowIso();
    const audit = [
        {
            at: now,
            actor: (_c = input.createdBy) !== null && _c !== void 0 ? _c : "system",
            event: "created",
            ip: ip !== null && ip !== void 0 ? ip : null,
            userAgent: userAgent !== null && userAgent !== void 0 ? userAgent : null,
            details: {},
        },
    ];
    return {
        id,
        tenantId,
        fileId: input.fileId,
        title: input.title,
        message: (_d = input.message) !== null && _d !== void 0 ? _d : null,
        status: "pending",
        signers,
        fields,
        audit,
        certificateKey: null,
        completedAt: null,
        expiresAt: (_e = input.expiresAt) !== null && _e !== void 0 ? _e : null,
        createdBy: (_f = input.createdBy) !== null && _f !== void 0 ? _f : null,
        createdAt: now,
        updatedAt: now,
    };
}
function appendAudit(request, entry) {
    const audit = [
        ...request.audit,
        Object.assign(Object.assign({}, entry), { at: nowIso() }),
    ];
    return Object.assign(Object.assign({}, request), { audit, updatedAt: nowIso() });
}
function deriveStatus(request) {
    if (request.status === "declined" || request.status === "expired")
        return request.status;
    if (request.signers.length === 0)
        return request.status;
    const statuses = request.signers.map((s) => s.status);
    if (statuses.every((s) => s === "signed" || s === "completed"))
        return "completed";
    if (statuses.some((s) => s === "signed"))
        return "signed";
    if (statuses.some((s) => s === "viewed"))
        return "viewed";
    return "pending";
}
export function markSignerViewed(request, signerToken, ctx = {}) {
    var _a, _b;
    const signers = request.signers.map((s) => {
        var _a, _b;
        if (s.token !== signerToken)
            return s;
        if (s.status !== "pending")
            return s;
        return Object.assign(Object.assign({}, s), { status: "viewed", viewedAt: nowIso(), ip: (_a = ctx.ip) !== null && _a !== void 0 ? _a : null, userAgent: (_b = ctx.userAgent) !== null && _b !== void 0 ? _b : null });
    });
    const next = Object.assign(Object.assign({}, request), { signers });
    const audited = appendAudit(next, {
        actor: signerToken,
        event: "viewed",
        ip: (_a = ctx.ip) !== null && _a !== void 0 ? _a : null,
        userAgent: (_b = ctx.userAgent) !== null && _b !== void 0 ? _b : null,
        details: {},
    });
    return Object.assign(Object.assign({}, audited), { status: deriveStatus(audited) });
}
export function fillField(request, signerToken, fieldId, value, ctx = {}) {
    var _a, _b;
    const fields = request.fields.map((f) => f.id === fieldId ? Object.assign(Object.assign({}, f), { value }) : f);
    const next = Object.assign(Object.assign({}, request), { fields });
    return appendAudit(next, {
        actor: signerToken,
        event: "field_filled",
        ip: (_a = ctx.ip) !== null && _a !== void 0 ? _a : null,
        userAgent: (_b = ctx.userAgent) !== null && _b !== void 0 ? _b : null,
        details: { fieldId },
    });
}
export function markSignerSigned(request, signerToken, ctx = {}) {
    var _a, _b;
    const signedAt = nowIso();
    const fields = request.fields.map((f) => f.value !== null && f.signedAt === null ? Object.assign(Object.assign({}, f), { signedAt }) : f);
    const signers = request.signers.map((s) => {
        var _a, _b;
        return s.token === signerToken
            ? Object.assign(Object.assign({}, s), { status: "signed", signedAt, ip: (_a = ctx.ip) !== null && _a !== void 0 ? _a : s.ip, userAgent: (_b = ctx.userAgent) !== null && _b !== void 0 ? _b : s.userAgent }) : s;
    });
    const next = Object.assign(Object.assign({}, request), { fields, signers });
    const audited = appendAudit(next, {
        actor: signerToken,
        event: "signed",
        ip: (_a = ctx.ip) !== null && _a !== void 0 ? _a : null,
        userAgent: (_b = ctx.userAgent) !== null && _b !== void 0 ? _b : null,
        details: {},
    });
    const status = deriveStatus(audited);
    return Object.assign(Object.assign({}, audited), { status, completedAt: status === "completed" ? nowIso() : audited.completedAt });
}
export function declineRequest(request, signerToken, reason, ctx = {}) {
    var _a, _b;
    const signers = request.signers.map((s) => s.token === signerToken
        ? Object.assign(Object.assign({}, s), { status: "declined" }) : s);
    const next = Object.assign(Object.assign({}, request), { signers, status: "declined" });
    return appendAudit(next, {
        actor: signerToken,
        event: "declined",
        ip: (_a = ctx.ip) !== null && _a !== void 0 ? _a : null,
        userAgent: (_b = ctx.userAgent) !== null && _b !== void 0 ? _b : null,
        details: { reason },
    });
}
export function appendSignerReminder(request, signerId, ctx = {}) {
    var _a, _b;
    return appendAudit(request, {
        actor: (_b = (_a = ctx.actor) !== null && _a !== void 0 ? _a : request.createdBy) !== null && _b !== void 0 ? _b : "system",
        event: "reminder_sent",
        ip: null,
        userAgent: null,
        details: { signerId },
    });
}
export function expireRequest(request) {
    if (request.status === "completed")
        return request;
    return appendAudit(Object.assign(Object.assign({}, request), { status: "expired" }), {
        actor: "system",
        event: "expired",
        ip: null,
        userAgent: null,
        details: {},
    });
}
export function buildCertificate(request) {
    return {
        requestId: request.id,
        fileId: request.fileId,
        title: request.title,
        completedAt: request.completedAt,
        signers: request.signers.map((s) => ({
            id: s.id,
            name: s.name,
            email: s.email,
            signedAt: s.signedAt,
            ip: s.ip,
            userAgent: s.userAgent,
        })),
        audit: request.audit,
    };
}
export function findSignerByToken(request, token) {
    var _a;
    return (_a = request.signers.find((s) => s.token === token)) !== null && _a !== void 0 ? _a : null;
}
