// Signature engine — request lifecycle, signer workflow, audit trail.

import type {
  FileSignatureAuditEntry,
  FileSignatureField,
  FileSignatureRequest,
  FileSignatureSigner,
  SignatureRequestInput,
  SignatureStatus,
} from "./types";

function nowIso(): string {
  return new Date().toISOString();
}

function uuid(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `sigx_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

function signerToken(): string {
  return uuid().replace(/-/g, "").slice(0, 40);
}

export interface BuildRequestInput {
  tenantId: string;
  input: SignatureRequestInput;
  ip?: string | null;
  userAgent?: string | null;
}

export function buildSignatureRequest({
  tenantId,
  input,
  ip,
  userAgent,
}: BuildRequestInput): FileSignatureRequest {
  const id = uuid();
  const signers: FileSignatureSigner[] = (input.signers ?? []).map((s, idx) => ({
    id: s.id ?? uuid(),
    name: s.name,
    email: s.email,
    profileId: s.profileId ?? null,
    order: typeof s.order === "number" ? s.order : idx,
    status: "pending",
    viewedAt: null,
    signedAt: null,
    ip: null,
    userAgent: null,
    token: signerToken(),
  }));
  const fields: FileSignatureField[] = (input.fields ?? []).map((f) => ({
    id: f.id ?? uuid(),
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
  }));
  const now = nowIso();
  const audit: FileSignatureAuditEntry[] = [
    {
      at: now,
      actor: input.createdBy ?? "system",
      event: "created",
      ip: ip ?? null,
      userAgent: userAgent ?? null,
      details: {},
    },
  ];
  return {
    id,
    tenantId,
    fileId: input.fileId,
    title: input.title,
    message: input.message ?? null,
    status: "pending",
    signers,
    fields,
    audit,
    certificateKey: null,
    completedAt: null,
    expiresAt: input.expiresAt ?? null,
    createdBy: input.createdBy ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

function appendAudit(
  request: FileSignatureRequest,
  entry: Omit<FileSignatureAuditEntry, "at">,
): FileSignatureRequest {
  const audit = [
    ...request.audit,
    { ...entry, at: nowIso() } satisfies FileSignatureAuditEntry,
  ];
  return { ...request, audit, updatedAt: nowIso() };
}

function deriveStatus(request: FileSignatureRequest): SignatureStatus {
  if (request.status === "declined" || request.status === "expired")
    return request.status;
  if (request.signers.length === 0) return request.status;
  const statuses = request.signers.map((s) => s.status);
  if (statuses.every((s) => s === "signed" || s === "completed"))
    return "completed";
  if (statuses.some((s) => s === "signed")) return "signed";
  if (statuses.some((s) => s === "viewed")) return "viewed";
  return "pending";
}

export function markSignerViewed(
  request: FileSignatureRequest,
  signerToken: string,
  ctx: { ip?: string | null; userAgent?: string | null } = {},
): FileSignatureRequest {
  const signers = request.signers.map((s) => {
    if (s.token !== signerToken) return s;
    if (s.status !== "pending") return s;
    return {
      ...s,
      status: "viewed" as SignatureStatus,
      viewedAt: nowIso(),
      ip: ctx.ip ?? null,
      userAgent: ctx.userAgent ?? null,
    };
  });
  const next: FileSignatureRequest = { ...request, signers };
  const audited = appendAudit(next, {
    actor: signerToken,
    event: "viewed",
    ip: ctx.ip ?? null,
    userAgent: ctx.userAgent ?? null,
    details: {},
  });
  return { ...audited, status: deriveStatus(audited) };
}

export function fillField(
  request: FileSignatureRequest,
  signerToken: string,
  fieldId: string,
  value: string,
  ctx: { ip?: string | null; userAgent?: string | null } = {},
): FileSignatureRequest {
  const fields = request.fields.map((f) =>
    f.id === fieldId ? { ...f, value } : f,
  );
  const next: FileSignatureRequest = { ...request, fields };
  return appendAudit(next, {
    actor: signerToken,
    event: "field_filled",
    ip: ctx.ip ?? null,
    userAgent: ctx.userAgent ?? null,
    details: { fieldId },
  });
}

export function markSignerSigned(
  request: FileSignatureRequest,
  signerToken: string,
  ctx: { ip?: string | null; userAgent?: string | null } = {},
): FileSignatureRequest {
  const signedAt = nowIso();
  const fields = request.fields.map((f) =>
    f.value !== null && f.signedAt === null ? { ...f, signedAt } : f,
  );
  const signers = request.signers.map((s) =>
    s.token === signerToken
      ? {
          ...s,
          status: "signed" as SignatureStatus,
          signedAt,
          ip: ctx.ip ?? s.ip,
          userAgent: ctx.userAgent ?? s.userAgent,
        }
      : s,
  );
  const next: FileSignatureRequest = { ...request, fields, signers };
  const audited = appendAudit(next, {
    actor: signerToken,
    event: "signed",
    ip: ctx.ip ?? null,
    userAgent: ctx.userAgent ?? null,
    details: {},
  });
  const status = deriveStatus(audited);
  return {
    ...audited,
    status,
    completedAt: status === "completed" ? nowIso() : audited.completedAt,
  };
}

export function declineRequest(
  request: FileSignatureRequest,
  signerToken: string,
  reason: string | null,
  ctx: { ip?: string | null; userAgent?: string | null } = {},
): FileSignatureRequest {
  const signers = request.signers.map((s) =>
    s.token === signerToken
      ? { ...s, status: "declined" as SignatureStatus }
      : s,
  );
  const next: FileSignatureRequest = {
    ...request,
    signers,
    status: "declined",
  };
  return appendAudit(next, {
    actor: signerToken,
    event: "declined",
    ip: ctx.ip ?? null,
    userAgent: ctx.userAgent ?? null,
    details: { reason },
  });
}

export function appendSignerReminder(
  request: FileSignatureRequest,
  signerId: string,
  ctx: { actor?: string | null } = {},
): FileSignatureRequest {
  return appendAudit(request, {
    actor: ctx.actor ?? request.createdBy ?? "system",
    event: "reminder_sent",
    ip: null,
    userAgent: null,
    details: { signerId },
  });
}

export function expireRequest(
  request: FileSignatureRequest,
): FileSignatureRequest {
  if (request.status === "completed") return request;
  return appendAudit(
    { ...request, status: "expired" satisfies SignatureStatus },
    {
      actor: "system",
      event: "expired",
      ip: null,
      userAgent: null,
      details: {},
    },
  );
}

export interface SignatureCertificate {
  requestId: string;
  fileId: string;
  title: string;
  completedAt: string | null;
  signers: Array<{
    id: string;
    name: string;
    email: string;
    signedAt: string | null;
    ip: string | null;
    userAgent: string | null;
  }>;
  audit: FileSignatureAuditEntry[];
}

export function buildCertificate(
  request: FileSignatureRequest,
): SignatureCertificate {
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

export function findSignerByToken(
  request: FileSignatureRequest,
  token: string,
): FileSignatureSigner | null {
  return request.signers.find((s) => s.token === token) ?? null;
}
