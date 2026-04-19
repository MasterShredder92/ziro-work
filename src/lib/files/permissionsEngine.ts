// Files & Documents OS — fine-grained permissions engine.
// Composes: role defaults → folder inheritance → per-file ACL → share links.

import type { Role } from "@/lib/auth/roles";
import { hasPermission } from "@/lib/auth/permissions";
import type {
  FileAclEntry,
  FileAclScope,
  FileFolder,
  FileObject,
  FilePermissionContext,
  FilePermissionSummary,
  FileShareLink,
} from "./types";
import { isExpired } from "./storage";

function ctxMatches(entry: FileAclEntry, ctx: FilePermissionContext): boolean {
  if (entry.principalType === "user") return entry.principalId === ctx.userId;
  if (entry.principalType === "profile")
    return entry.principalId === (ctx.profileId ?? ctx.userId);
  if (entry.principalType === "role") return entry.principalId === ctx.role;
  return false;
}

function aclGrants(
  entries: FileAclEntry[] | undefined,
  ctx: FilePermissionContext,
  scope: FileAclScope,
): boolean {
  if (!entries || entries.length === 0) return false;
  for (const entry of entries) {
    if (!ctxMatches(entry, ctx)) continue;
    if (entry.scopes.includes(scope)) return true;
  }
  return false;
}

function isOwner(file: FileObject, ctx: FilePermissionContext): boolean {
  if (!file.ownerId) return false;
  return file.ownerId === (ctx.userId ?? ctx.profileId);
}

function isFolderOwner(
  folder: FileFolder | null,
  ctx: FilePermissionContext,
): boolean {
  if (!folder?.ownerId) return false;
  return folder.ownerId === (ctx.userId ?? ctx.profileId);
}

function roleAllowsWrite(role: Role): boolean {
  return hasPermission(role, "files.write");
}

function roleAllowsRead(role: Role): boolean {
  return hasPermission(role, "files.read");
}

function roleAllowsShare(role: Role): boolean {
  return hasPermission(role, "files.share") || role === "admin" || role === "director";
}

function roleAllowsSign(role: Role): boolean {
  return hasPermission(role, "files.sign") || role === "admin" || role === "director";
}

export function computeFilePermissions(input: {
  file: FileObject;
  folder: FileFolder | null;
  context: FilePermissionContext;
}): FilePermissionSummary {
  const { file, folder, context } = input;
  const role = context.role as Role;
  const tenantMatches = file.tenantId === context.tenantId;

  let canRead = false;
  let canWrite = false;
  let canShare = false;
  let canSign = false;
  let reason: string | null = null;

  if (!tenantMatches) {
    const deny = "This file belongs to another organization.";
    return {
      canRead: false,
      canWrite: false,
      canShare: false,
      canSign: false,
      reason: "Different tenant",
      hints: {
        read: deny,
        write: deny,
        share: deny,
        sign: deny,
      },
    };
  }

  if (role === "admin" || role === "director") {
    canRead = true;
    canWrite = true;
    canShare = true;
    canSign = true;
    return { canRead, canWrite, canShare, canSign, reason, hints: {} };
  }

  if (isOwner(file, context) || isFolderOwner(folder, context)) {
    canRead = true;
    canWrite = true;
    canShare = roleAllowsShare(role);
    canSign = roleAllowsSign(role);
    return {
      canRead,
      canWrite,
      canShare,
      canSign,
      reason,
      hints: {
        share: canShare
          ? null
          : "Sharing requires director/admin (or files.share on your role).",
        sign: canSign
          ? null
          : "Signature requests require director/admin (or files.sign on your role).",
      },
    };
  }

  if (file.visibility === "public") canRead = true;
  if (file.visibility === "tenant" && roleAllowsRead(role)) canRead = true;

  const aclRead = aclGrants(file.acl, context, "read");
  const aclWrite = aclGrants(file.acl, context, "write");
  const aclShare = aclGrants(file.acl, context, "share");

  const folderRead = folder ? aclGrants(folder.acl, context, "read") : false;
  const folderWrite = folder ? aclGrants(folder.acl, context, "write") : false;
  const folderShare = folder ? aclGrants(folder.acl, context, "share") : false;

  canRead = canRead || aclRead || folderRead;
  canWrite = aclWrite || folderWrite || (roleAllowsWrite(role) && role === "teacher" && canRead);
  canShare = aclShare || folderShare || (roleAllowsShare(role) && canWrite);
  canSign = roleAllowsSign(role) && canWrite;

  if (!canRead) reason = "No read grant";

  const hints: NonNullable<FilePermissionSummary["hints"]> = {};
  if (!canRead) {
    hints.read =
      "Visibility and ACL do not grant read access, or your role cannot read tenant files.";
  }
  if (!canWrite) {
    hints.write = canRead
      ? "No write ACL on this file or its folder; teachers need explicit write on the file."
      : "You need read access before write can apply.";
  }
  if (!canShare) {
    hints.share =
      canWrite && roleAllowsShare(role)
        ? "Sharing is blocked by ACL on this file or folder."
        : "Requires write access and a role that may share (or explicit ACL).";
  }
  if (!canSign) {
    hints.sign =
      canWrite && roleAllowsSign(role)
        ? "Signature requests need files.sign permission and write on this file."
        : "Requires write access and files.sign (director/admin or granted).";
  }

  return { canRead, canWrite, canShare, canSign, reason, hints };
}

export function assertCanRead(input: {
  file: FileObject;
  folder: FileFolder | null;
  context: FilePermissionContext;
}): void {
  const res = computeFilePermissions(input);
  if (!res.canRead) throw new Error("FORBIDDEN");
}

export function assertCanWrite(input: {
  file: FileObject;
  folder: FileFolder | null;
  context: FilePermissionContext;
}): void {
  const res = computeFilePermissions(input);
  if (!res.canWrite) throw new Error("FORBIDDEN");
}

export function assertCanShare(input: {
  file: FileObject;
  folder: FileFolder | null;
  context: FilePermissionContext;
}): void {
  const res = computeFilePermissions(input);
  if (!res.canShare) throw new Error("FORBIDDEN");
}

export function assertCanSign(input: {
  file: FileObject;
  folder: FileFolder | null;
  context: FilePermissionContext;
}): void {
  const res = computeFilePermissions(input);
  if (!res.canSign) throw new Error("FORBIDDEN");
}

export interface ShareLinkEvaluation {
  allowed: boolean;
  reason: string | null;
}

export function evaluateShareLink(
  link: FileShareLink,
  input: { password?: string | null; now?: Date },
): ShareLinkEvaluation {
  const now = input.now ?? new Date();
  const meta = link.metadata ?? {};
  if (meta.linkDisabled === true)
    return { allowed: false, reason: "Link disabled by owner" };
  if (link.status === "revoked") return { allowed: false, reason: "Revoked" };
  if (link.status === "expired") return { allowed: false, reason: "Expired" };
  if (isExpired(link.expiresAt, now))
    return { allowed: false, reason: "Expired" };
  if (link.maxViews !== null && link.viewCount >= link.maxViews)
    return { allowed: false, reason: "View limit reached" };
  if (link.passwordHash) {
    if (!input.password) return { allowed: false, reason: "Password required" };
    if (hashPassword(input.password) !== link.passwordHash)
      return { allowed: false, reason: "Invalid password" };
  }
  return { allowed: true, reason: null };
}

/**
 * Lightweight, deterministic password hash for share-link validation.
 * Good enough for non-sensitive public viewers; swap for bcrypt/argon for PII.
 */
export function hashPassword(password: string): string {
  let h = 0;
  for (let i = 0; i < password.length; i++) {
    h = ((h << 5) - h + password.charCodeAt(i)) | 0;
  }
  return `plain-${(h >>> 0).toString(16)}-${password.length}`;
}

export function roleDefaultVisibility(role: Role): FileObject["visibility"] {
  if (role === "admin" || role === "director") return "tenant";
  if (role === "teacher") return "tenant";
  return "private";
}

/**
 * Public share-link viewers are anonymous. If a folder defines a non-empty ACL,
 * a private file with no supplemental ACL cannot be exposed through a token —
 * folder restrictions are not bypassed by the mere existence of a link row.
 */
export function publicShareLinkAllowedForFileInFolder(
  file: FileObject,
  folder: FileFolder | null,
): boolean {
  if (!folder) return true;
  const folderAcl = folder.acl ?? [];
  if (folderAcl.length === 0) return true;
  if (file.visibility === "public" || file.visibility === "tenant" || file.visibility === "shared") {
    return true;
  }
  const fileAcl = file.acl ?? [];
  return fileAcl.length > 0;
}

/** Folder surface: browse / share / sign-style summary (inherits parent ACL). */
export function computeFolderAccessPermissions(input: {
  folder: FileFolder;
  parent: FileFolder | null;
  context: FilePermissionContext;
}): FilePermissionSummary {
  const { folder, parent, context } = input;
  const role = context.role as Role;
  if (folder.tenantId !== context.tenantId) {
    return {
      canRead: false,
      canWrite: false,
      canShare: false,
      canSign: false,
      reason: "Different tenant",
    };
  }

  if (role === "admin" || role === "director") {
    return { canRead: true, canWrite: true, canShare: true, canSign: false, reason: null };
  }

  if (isFolderOwner(folder, context)) {
    return {
      canRead: true,
      canWrite: true,
      canShare: roleAllowsShare(role),
      canSign: false,
      reason: null,
    };
  }

  let canRead = false;
  if (folder.visibility === "public") canRead = true;
  if (folder.visibility === "tenant" && roleAllowsRead(role)) canRead = true;
  if (folder.visibility === "shared" && roleAllowsRead(role)) canRead = true;

  const aclRead =
    aclGrants(folder.acl, context, "read") ||
    (parent ? aclGrants(parent.acl, context, "read") : false);
  const aclWrite =
    aclGrants(folder.acl, context, "write") ||
    (parent ? aclGrants(parent.acl, context, "write") : false);
  const aclShare =
    aclGrants(folder.acl, context, "share") ||
    (parent ? aclGrants(parent.acl, context, "share") : false);

  canRead = canRead || aclRead;
  const canWrite =
    aclWrite ||
    (roleAllowsWrite(role) && role === "teacher" && canRead);
  const canShare =
    aclShare ||
    (roleAllowsShare(role) && canWrite);

  let reason: string | null = null;
  if (!canRead) reason = "No read grant";
  return { canRead, canWrite, canShare, canSign: false, reason };
}

/** Creating a subfolder or editing under inherited ACL — uses access (parent) rules. */
export function assertCanWriteFolderHierarchy(input: {
  folder: FileFolder;
  parent: FileFolder | null;
  context: FilePermissionContext;
}): void {
  const res = computeFolderAccessPermissions(input);
  if (!res.canWrite) throw new Error("FORBIDDEN");
}

/** Rename/move/delete/create-under: uses folder + parent ACL inheritance (see computeFolderMutationPermissions for coarse ACL). */
export function assertCanWriteFolder(input: {
  folder: FileFolder;
  parent: FileFolder | null;
  context: FilePermissionContext;
}): void {
  const res = computeFolderAccessPermissions(input);
  if (!res.canWrite) throw new Error("FORBIDDEN");
}

/** Folder-level write/delete for rename, move, and folder removal (not file ACL on a row). */
export function computeFolderMutationPermissions(input: {
  folder: FileFolder;
  context: FilePermissionContext;
}): { canWrite: boolean; canDelete: boolean; reason: string | null } {
  const { folder, context } = input;
  const role = context.role as Role;
  if (folder.tenantId !== context.tenantId) {
    return { canWrite: false, canDelete: false, reason: "Different tenant" };
  }
  if (role === "admin" || role === "director") {
    return { canWrite: true, canDelete: true, reason: null };
  }
  if (isFolderOwner(folder, context)) {
    return { canWrite: true, canDelete: true, reason: null };
  }
  const folderWrite = aclGrants(folder.acl, context, "write");
  if (folderWrite) {
    return { canWrite: true, canDelete: role === "teacher", reason: null };
  }
  if (roleAllowsWrite(role) && folder.visibility === "tenant") {
    return { canWrite: true, canDelete: false, reason: null };
  }
  return { canWrite: false, canDelete: false, reason: "No folder write grant" };
}

export function assertCanDeleteFolder(input: {
  folder: FileFolder;
  parent: FileFolder | null;
  context: FilePermissionContext;
}): void {
  assertCanWriteFolder(input);
  const res = computeFolderMutationPermissions({
    folder: input.folder,
    context: input.context,
  });
  if (!res.canDelete) throw new Error("FORBIDDEN");
}

function runDevPermissionSelfChecks(): void {
  const baseCtx: FilePermissionContext = {
    role: "teacher",
    userId: "u1",
    profileId: "u1",
    tenantId: "t1",
  };
  const folder: FileFolder = {
    id: "f1",
    tenantId: "t1",
    parentId: null,
    name: "Shared",
    description: null,
    path: "Shared",
    ownerId: "other",
    visibility: "tenant",
    acl: [
      {
        principalType: "user",
        principalId: "u1",
        scopes: ["write"],
      },
    ],
    metadata: {},
    createdAt: "",
    updatedAt: "",
    createdBy: null,
    updatedBy: null,
  };
  const p = computeFolderMutationPermissions({ folder, context: baseCtx });
  if (!p.canWrite) {
    throw new Error("permissions self-check: folder ACL write should grant canWrite");
  }

  const folderInherit: FileFolder = {
    ...folder,
    id: "f2",
    visibility: "private",
    acl: [
      {
        principalType: "user",
        principalId: "u1",
        scopes: ["read"],
      },
    ],
  };
  const fileInFolder: FileObject = {
    id: "file1",
    tenantId: "t1",
    folderId: "f2",
    ownerId: "other",
    name: "a.pdf",
    description: null,
    mimeType: "application/pdf",
    size: 1,
    extension: "pdf",
    storageKey: "k",
    storageBucket: "files",
    checksum: null,
    visibility: "private",
    status: "active",
    currentVersionId: null,
    thumbnailKey: null,
    virusScanStatus: "skipped",
    signatureStatus: null,
    tags: [],
    acl: [],
    metadata: {},
    createdAt: "",
    updatedAt: "",
    createdBy: null,
    updatedBy: null,
  };
  const inherited = computeFilePermissions({
    file: fileInFolder,
    folder: folderInherit,
    context: baseCtx,
  });
  if (!inherited.canRead) {
    throw new Error("permissions self-check: folder ACL read should inherit to file read");
  }

  const link: FileShareLink = {
    id: "l1",
    tenantId: "t1",
    fileId: "file1",
    folderId: null,
    token: "tok",
    status: "active",
    passwordHash: null,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    maxViews: 10,
    viewCount: 0,
    allowDownload: true,
    createdBy: null,
    createdAt: "",
    updatedAt: "",
    metadata: {},
  };
  const ev = evaluateShareLink(link, {});
  if (!ev.allowed) throw new Error("permissions self-check: active link should allow");
  const expired = evaluateShareLink(
    { ...link, expiresAt: new Date(Date.now() - 60_000).toISOString() },
    {},
  );
  if (expired.allowed) {
    throw new Error("permissions self-check: expired link should deny");
  }

  const aclFolder: FileFolder = {
    ...folderInherit,
    id: "f_acl",
    acl: [{ principalType: "user" as const, principalId: "u9", scopes: ["read"] }],
  };
  if (
    publicShareLinkAllowedForFileInFolder(
      { ...fileInFolder, visibility: "private", acl: [] },
      aclFolder,
    )
  ) {
    throw new Error(
      "permissions self-check: private file in ACL folder should block anonymous share unless file ACL/visibility opens it",
    );
  }
  if (
    !publicShareLinkAllowedForFileInFolder(
      { ...fileInFolder, visibility: "tenant" },
      aclFolder,
    )
  ) {
    throw new Error("permissions self-check: tenant visibility should allow share link access check");
  }
}

if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
  try {
    runDevPermissionSelfChecks();
  } catch (e) {
    console.error("[files] permissionsEngine self-check failed:", e);
  }
}
