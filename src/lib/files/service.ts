// Service layer for Files OS. Orchestrates queries + engines + KPIs.

import { assertTenantAccess } from "@/lib/auth/guards";
import type { Role } from "@/lib/auth/roles";
import {
  createSignedUrlCached,
  decodeBase64,
  deleteBlob,
  extensionFromName,
  generateThumbnail,
  isExpired,
  resolveMimeType,
  scanForVirus,
  uploadBlobWithIntegrityRetry,
  readBlob,
} from "./storage";
import {
  assertCanDeleteFolder,
  assertCanRead,
  assertCanShare,
  assertCanSign,
  assertCanWrite,
  assertCanWriteFolder,
  assertCanWriteFolderHierarchy,
  computeFilePermissions,
  computeFolderAccessPermissions,
  evaluateShareLink,
  hashPassword,
  publicShareLinkAllowedForFileInFolder,
  roleDefaultVisibility,
} from "./permissionsEngine";
import {
  appendSignerReminder,
  buildSignatureRequest,
  declineRequest,
  expireRequest,
  fillField,
  findSignerByToken,
  markSignerSigned,
  markSignerViewed,
} from "./signatureEngine";
import { recordUsage } from "@/lib/billing/billingOps";
import * as q from "./queries";
import type {
  FileAclEntry,
  FileFolder,
  FileFolderInput,
  FileInput,
  FileObject,
  FilePermissionContext,
  FileShareLink,
  FileShareLinkInput,
  FileSignatureRequest,
  FileSignedUrl,
  FileSurface,
  FileUploadPayload,
  FilesDashboardData,
  FolderSurface,
  SignatureRequestInput,
  SignatureSurface,
} from "./types";

function nowIso(): string {
  return new Date().toISOString();
}

function uuid(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `file_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

function shareToken(): string {
  return uuid().replace(/-/g, "").slice(0, 32);
}

function sevenDaysAgoIso(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 7);
  return d.toISOString();
}

function computeFilesKpis(
  files: FileObject[],
  folders: FileFolder[],
  shareLinks: FileShareLink[],
  signatureRequests: FileSignatureRequest[],
): FilesDashboardData["kpis"] {
  const storageBytes = files.reduce((a, f) => a + (f.size ?? 0), 0);
  const sevenDaysAgo = sevenDaysAgoIso();
  const activeShareLinks = shareLinks.filter(
    (l) =>
      l.status === "active" &&
      !isExpired(l.expiresAt) &&
      (l.maxViews === null || l.viewCount < l.maxViews),
  ).length;
  const pendingSignatures = signatureRequests.filter(
    (r) => r.status === "pending" || r.status === "viewed" || r.status === "signed",
  ).length;
  const completedSignatures = signatureRequests.filter(
    (r) => r.status === "completed",
  ).length;
  const filesThisWeek = files.filter((f) => f.createdAt >= sevenDaysAgo).length;
  return {
    totalFiles: files.length,
    totalFolders: folders.length,
    storageBytes,
    activeShareLinks,
    pendingSignatures,
    completedSignatures,
    filesThisWeek,
  };
}

// -------- Context helpers --------

export type FilesServiceContext = FilePermissionContext;

export function buildContextFromSession(session: {
  role: string;
  userId: string;
  tenantId: string;
}): FilesServiceContext {
  return {
    role: session.role,
    userId: session.userId ?? null,
    profileId: session.userId ?? null,
    tenantId: session.tenantId,
  };
}

// -------- Dashboard & Surfaces --------

export async function getFilesDashboard(
  tenantId: string,
): Promise<FilesDashboardData> {
  await assertTenantAccess(tenantId);
  const [files, folders, shareLinks, signatureRequests] = await Promise.all([
    q.listFiles(tenantId),
    q.listFolders(tenantId),
    q.listShareLinks(tenantId),
    q.listSignatureRequests(tenantId),
  ]);
  const recent = [...files]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 10);
  const kpis = computeFilesKpis(files, folders, shareLinks, signatureRequests);
  return {
    files,
    folders,
    recent,
    signatureRequests: signatureRequests.slice(0, 25),
    shareLinks: shareLinks.slice(0, 25),
    kpis,
    generatedAt: nowIso(),
  };
}

export async function getFileSurface(
  fileId: string,
  tenantId: string,
  ctx: FilesServiceContext,
): Promise<FileSurface> {
  await assertTenantAccess(tenantId);
  const file = await q.getFile(fileId, tenantId);
  if (!file) throw new Error("NOT_FOUND");
  const folder = file.folderId
    ? await q.getFolder(file.folderId, tenantId)
    : null;
  assertCanRead({ file, folder, context: ctx });
  const [versions, shareLinks, signatureRequests] = await Promise.all([
    q.listVersions(fileId, tenantId),
    q.listShareLinks(tenantId, { fileId }),
    q.listSignatureRequests(tenantId, { fileId }),
  ]);
  const permissions = computeFilePermissions({ file, folder, context: ctx });
  return { file, folder, versions, shareLinks, signatureRequests, permissions };
}

export async function getFolderSurface(
  folderId: string,
  tenantId: string,
  ctx: FilesServiceContext,
): Promise<FolderSurface> {
  await assertTenantAccess(tenantId);
  const folder = await q.getFolder(folderId, tenantId);
  if (!folder) throw new Error("NOT_FOUND");
  const [files, subfolders, parent] = await Promise.all([
    q.listFiles(tenantId, { folderId }),
    q.listFolders(tenantId, folderId),
    folder.parentId ? q.getFolder(folder.parentId, tenantId) : Promise.resolve(null),
  ]);
  const permissions = computeFolderAccessPermissions({
    folder,
    parent,
    context: ctx,
  });
  return { folder, files, subfolders, permissions };
}

// -------- Files CRUD --------

export interface CreateFileOptions {
  tenantId: string;
  input: FileInput;
  upload?: FileUploadPayload;
  context: FilesServiceContext;
}

export async function createFile({
  tenantId,
  input,
  upload,
  context,
}: CreateFileOptions): Promise<FileObject> {
  await assertTenantAccess(tenantId);
  const role = context.role as Role;
  const trimmedName =
    (input.name?.trim() || upload?.fileName?.trim() || "");
  if (upload && trimmedName) {
    const existing = await q.findFileByFolderAndName(
      tenantId,
      input.folderId ?? null,
      trimmedName,
    );
    if (existing) {
      const existingFolder = existing.folderId
        ? await q.getFolder(existing.folderId, tenantId)
        : null;
      assertCanWrite({
        file: existing,
        folder: existingFolder,
        context,
      });
      return uploadNewVersion(existing.id, tenantId, upload, context);
    }
  }
  const folder = input.folderId
    ? await q.getFolder(input.folderId, tenantId)
    : null;
  if (folder) {
    assertCanWrite({
      file: {
        id: "seed",
        tenantId,
        folderId: folder.id,
        ownerId: context.userId,
        name: input.name,
        description: null,
        mimeType: input.mimeType ?? "application/octet-stream",
        size: 0,
        extension: null,
        storageKey: null,
        storageBucket: null,
        checksum: null,
        visibility: input.visibility ?? roleDefaultVisibility(role),
        status: "active",
        currentVersionId: null,
        thumbnailKey: null,
        virusScanStatus: "skipped",
        signatureStatus: null,
        tags: [],
        acl: (input.acl ?? []) as FileAclEntry[],
        metadata: {},
        createdAt: nowIso(),
        updatedAt: nowIso(),
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      folder,
      context,
    });
  } else if (role !== "admin" && role !== "director" && role !== "teacher") {
    throw new Error("FORBIDDEN");
  }

  const visibility = input.visibility ?? roleDefaultVisibility(role);
  const fileId = uuid();
  let mimeType = input.mimeType ?? "application/octet-stream";
  let size = input.size ?? 0;
  let storageKey = input.storageKey ?? null;
  let storageBucket = input.storageBucket ?? null;
  let checksum = input.checksum ?? null;
  let thumbnailKey: string | null = input.thumbnailKey ?? null;
  let virusScanStatus: FileObject["virusScanStatus"] = "skipped";
  let currentVersionId: string | null = null;

  if (upload) {
    const bytes = decodeBase64(upload.base64);
    mimeType = resolveMimeType(upload.fileName, upload.mimeType, bytes);
    size = bytes.length;
    virusScanStatus = await scanForVirus(bytes);
    const stored = await uploadBlobWithIntegrityRetry({
      tenantId,
      fileId,
      fileName: upload.fileName,
      mimeType,
      bytes,
      version: 1,
    });
    mimeType = stored.mimeType;
    checksum = stored.checksum;
    if (upload.checksum && upload.checksum !== checksum) {
      throw new Error("CHECKSUM_MISMATCH");
    }
    storageKey = stored.storageKey;
    storageBucket = stored.storageBucket;
    thumbnailKey = await generateThumbnail(mimeType, stored.storageKey);
    const version = await q.createVersion(tenantId, {
      fileId,
      storageKey: stored.storageKey,
      storageBucket: stored.storageBucket,
      size: stored.size,
      mimeType,
      checksum,
      uploadedBy: context.userId,
      notes: upload.notes ?? null,
    });
    currentVersionId = version.id;
    await recordUsage({
      tenantId,
      metric: "storage",
      amount: bytes.length,
      source: "files",
      metadata: { fileId, versionId: version.id },
    }).catch(() => null);
  }

  const created = await q.upsertFile(tenantId, {
    id: fileId,
    name: input.name,
    description: input.description ?? null,
    folderId: input.folderId ?? null,
    ownerId: input.ownerId ?? context.userId,
    mimeType,
    size,
    extension: input.extension ?? extensionFromName(input.name),
    storageKey,
    storageBucket,
    checksum,
    visibility,
    status: input.status ?? "active",
    currentVersionId,
    thumbnailKey,
    virusScanStatus,
    tags: input.tags ?? [],
    acl: (input.acl ?? []) as FileAclEntry[],
    metadata: input.metadata ?? {},
    createdBy: context.userId,
    updatedBy: context.userId,
  });
  // automation removed — file.uploaded trigger is a no-op until agents are rebuilt
  return created;
}

export async function updateFile(
  fileId: string,
  tenantId: string,
  patch: Partial<FileObject>,
  ctx: FilesServiceContext,
): Promise<FileObject> {
  await assertTenantAccess(tenantId);
  const existing = await q.getFile(fileId, tenantId);
  if (!existing) throw new Error("NOT_FOUND");
  const folder = existing.folderId
    ? await q.getFolder(existing.folderId, tenantId)
    : null;
  assertCanWrite({ file: existing, folder, context: ctx });
  return q.upsertFile(tenantId, {
    ...existing,
    ...patch,
    id: fileId,
    updatedBy: ctx.userId,
  });
}

export async function deleteFileById(
  fileId: string,
  tenantId: string,
  ctx: FilesServiceContext,
): Promise<void> {
  await assertTenantAccess(tenantId);
  const existing = await q.getFile(fileId, tenantId);
  if (!existing) throw new Error("NOT_FOUND");
  const folder = existing.folderId
    ? await q.getFolder(existing.folderId, tenantId)
    : null;
  assertCanWrite({ file: existing, folder, context: ctx });
  await q.deleteFile(fileId, tenantId);
}

export async function uploadNewVersion(
  fileId: string,
  tenantId: string,
  upload: FileUploadPayload,
  ctx: FilesServiceContext,
): Promise<FileObject> {
  await assertTenantAccess(tenantId);
  const file = await q.getFile(fileId, tenantId);
  if (!file) throw new Error("NOT_FOUND");
  const folder = file.folderId
    ? await q.getFolder(file.folderId, tenantId)
    : null;
  assertCanWrite({ file, folder, context: ctx });

  const bytes = decodeBase64(upload.base64);
  let mimeType = resolveMimeType(upload.fileName, upload.mimeType, bytes);
  const virusScan = await scanForVirus(bytes);
  const previousVersions = await q.listVersions(fileId, tenantId);
  const nextVersion =
    (previousVersions[0]?.version ?? 0) + 1 || 1;
  const stored = await uploadBlobWithIntegrityRetry({
    tenantId,
    fileId,
    fileName: upload.fileName,
    mimeType,
    bytes,
    version: nextVersion,
  });
  mimeType = stored.mimeType;
  const checksum = stored.checksum;
  if (upload.checksum && upload.checksum !== checksum) {
    throw new Error("CHECKSUM_MISMATCH");
  }
  const thumbnailKey = await generateThumbnail(mimeType, stored.storageKey);
  const version = await q.createVersion(tenantId, {
    fileId,
    version: nextVersion,
    storageKey: stored.storageKey,
    storageBucket: stored.storageBucket,
    size: stored.size,
    mimeType,
    checksum,
    uploadedBy: ctx.userId,
    notes: upload.notes ?? null,
  });
  await recordUsage({
    tenantId,
    metric: "storage",
    amount: bytes.length,
    source: "files",
    metadata: { fileId, versionId: version.id, version: nextVersion },
  }).catch(() => null);
  return q.upsertFile(tenantId, {
    ...file,
    id: fileId,
    mimeType,
    size: bytes.length,
    storageKey: stored.storageKey,
    storageBucket: stored.storageBucket,
    checksum,
    thumbnailKey,
    virusScanStatus: virusScan,
    currentVersionId: version.id,
    updatedBy: ctx.userId,
  });
}

export async function createSignedFileUrl(
  fileId: string,
  tenantId: string,
  ctx: FilesServiceContext,
  opts?: { ttlSeconds?: number; download?: boolean },
): Promise<FileSignedUrl> {
  await assertTenantAccess(tenantId);
  const file = await q.getFile(fileId, tenantId);
  if (!file) throw new Error("NOT_FOUND");
  const folder = file.folderId
    ? await q.getFolder(file.folderId, tenantId)
    : null;
  assertCanRead({ file, folder, context: ctx });
  if (!file.storageKey) {
    return {
      url: "",
      expiresAt: nowIso(),
      storageKey: "",
      mimeType: file.mimeType,
      fileName: file.name,
    };
  }
  const signed = await createSignedUrlCached(tenantId, file.storageKey, {
    ttlSeconds: opts?.ttlSeconds,
    bucket: file.storageBucket ?? undefined,
    download: opts?.download,
  });
  return {
    url: signed.url,
    expiresAt: signed.expiresAt,
    storageKey: file.storageKey,
    mimeType: file.mimeType,
    fileName: file.name,
  };
}

// -------- Folders --------

async function assertValidFolderMove(
  folderId: string,
  newParentId: string | null,
  tenantId: string,
): Promise<void> {
  if (newParentId === null) return;
  if (newParentId === folderId) throw new Error("BAD_REQUEST: Invalid folder move");
  let walk: string | null = newParentId;
  const guard = new Set<string>();
  while (walk) {
    if (walk === folderId) {
      throw new Error("BAD_REQUEST: Cannot move a folder into itself");
    }
    if (guard.has(walk)) break;
    guard.add(walk);
    const f = await q.getFolder(walk, tenantId);
    walk = f?.parentId ?? null;
  }
  const moving = await q.getFolder(folderId, tenantId);
  if (!moving) throw new Error("NOT_FOUND");
  const siblings = await q.listFolders(tenantId, newParentId);
  if (
    siblings.some(
      (s) =>
        s.id !== folderId &&
        s.name.toLowerCase() === moving.name.toLowerCase(),
    )
  ) {
    throw new Error("BAD_REQUEST: A folder with this name already exists in the destination");
  }
}

export async function createFolder(
  tenantId: string,
  input: FileFolderInput,
  ctx: FilesServiceContext,
): Promise<FileFolder> {
  await assertTenantAccess(tenantId);
  if (ctx.role !== "admin" && ctx.role !== "director" && ctx.role !== "teacher") {
    throw new Error("FORBIDDEN");
  }
  const parent = input.parentId
    ? await q.getFolder(input.parentId, tenantId)
    : null;
  if (parent) {
    const grandparent = parent.parentId
      ? await q.getFolder(parent.parentId, tenantId)
      : null;
    assertCanWriteFolderHierarchy({
      folder: parent,
      parent: grandparent,
      context: ctx,
    });
  }
  const path = input.path ?? (parent ? `${parent.path}/${input.name}` : input.name);
  return q.upsertFolder(tenantId, {
    name: input.name,
    parentId: input.parentId ?? null,
    description: input.description ?? null,
    path,
    ownerId: input.ownerId ?? ctx.userId,
    visibility: input.visibility ?? roleDefaultVisibility(ctx.role as Role),
    acl: (input.acl ?? []) as FileAclEntry[],
    metadata: input.metadata ?? {},
    createdBy: ctx.userId,
    updatedBy: ctx.userId,
  });
}

export async function updateFolder(
  folderId: string,
  tenantId: string,
  patch: Partial<FileFolder>,
  ctx: FilesServiceContext,
): Promise<FileFolder> {
  await assertTenantAccess(tenantId);
  const existing = await q.getFolder(folderId, tenantId);
  if (!existing) throw new Error("NOT_FOUND");
  const existingParent = existing.parentId
    ? await q.getFolder(existing.parentId, tenantId)
    : null;
  assertCanWriteFolder({
    folder: existing,
    parent: existingParent,
    context: ctx,
  });
  if (patch.parentId !== undefined && patch.parentId !== existing.parentId) {
    await assertValidFolderMove(folderId, patch.parentId ?? null, tenantId);
    if (patch.parentId) {
      const newParent = await q.getFolder(patch.parentId, tenantId);
      if (newParent) {
        const gp = newParent.parentId
          ? await q.getFolder(newParent.parentId, tenantId)
          : null;
        assertCanWriteFolderHierarchy({
          folder: newParent,
          parent: gp,
          context: ctx,
        });
      }
    }
  }
  const mergedMetadata =
    patch.metadata !== undefined
      ? { ...existing.metadata, ...patch.metadata }
      : existing.metadata;
  const patchWithoutMeta: Partial<FileFolder> = { ...patch };
  delete (patchWithoutMeta as { metadata?: FileFolder["metadata"] }).metadata;
  return q.upsertFolder(tenantId, {
    ...existing,
    ...patchWithoutMeta,
    metadata: mergedMetadata,
    id: folderId,
    updatedBy: ctx.userId,
  });
}

export async function deleteFolderById(
  folderId: string,
  tenantId: string,
  ctx: FilesServiceContext,
): Promise<void> {
  await assertTenantAccess(tenantId);
  const existing = await q.getFolder(folderId, tenantId);
  if (!existing) throw new Error("NOT_FOUND");
  const existingParent = existing.parentId
    ? await q.getFolder(existing.parentId, tenantId)
    : null;
  assertCanDeleteFolder({
    folder: existing,
    parent: existingParent,
    context: ctx,
  });
  const [files, subs] = await Promise.all([
    q.listFiles(tenantId, { folderId }),
    q.listFolders(tenantId, folderId),
  ]);
  if (files.length > 0 || subs.length > 0) {
    throw new Error("BAD_REQUEST: Folder must be empty to delete");
  }
  await q.deleteFolder(folderId, tenantId);
}

// -------- Share links --------

export async function createShareLink(
  tenantId: string,
  input: FileShareLinkInput,
  ctx: FilesServiceContext,
): Promise<FileShareLink> {
  await assertTenantAccess(tenantId);
  if (input.fileId) {
    const file = await q.getFile(input.fileId, tenantId);
    if (!file) throw new Error("NOT_FOUND");
    const folder = file.folderId
      ? await q.getFolder(file.folderId, tenantId)
      : null;
    assertCanShare({ file, folder, context: ctx });
  } else if (input.folderId) {
    if (ctx.role !== "admin" && ctx.role !== "director") {
      throw new Error("FORBIDDEN");
    }
  } else {
    throw new Error("BAD_REQUEST: fileId or folderId required");
  }

  const expiresAt =
    input.expiresInSeconds && input.expiresInSeconds > 0
      ? new Date(Date.now() + input.expiresInSeconds * 1000).toISOString()
      : null;

  return q.upsertShareLink(tenantId, {
    fileId: input.fileId ?? null,
    folderId: input.folderId ?? null,
    token: shareToken(),
    status: "active",
    passwordHash: input.password ? hashPassword(input.password) : null,
    expiresAt,
    maxViews: input.maxViews ?? null,
    viewCount: 0,
    allowDownload: input.allowDownload ?? true,
    metadata: input.metadata ?? {},
    createdBy: ctx.userId ?? input.createdBy ?? null,
  });
}

export async function patchShareLink(
  linkId: string,
  tenantId: string,
  patch: Partial<
    Pick<
      FileShareLink,
      | "metadata"
      | "allowDownload"
      | "expiresAt"
      | "maxViews"
      | "status"
    >
  >,
  ctx: FilesServiceContext,
): Promise<FileShareLink> {
  await assertTenantAccess(tenantId);
  const existing = await q.getShareLink(linkId, tenantId);
  if (!existing) throw new Error("NOT_FOUND");
  if (existing.fileId) {
    const file = await q.getFile(existing.fileId, tenantId);
    if (!file) throw new Error("NOT_FOUND");
    const folder = file.folderId
      ? await q.getFolder(file.folderId, tenantId)
      : null;
    assertCanShare({ file, folder, context: ctx });
  } else if (ctx.role !== "admin" && ctx.role !== "director") {
    throw new Error("FORBIDDEN");
  }
  return q.upsertShareLink(tenantId, {
    id: linkId,
    metadata:
      patch.metadata !== undefined
        ? { ...existing.metadata, ...patch.metadata }
        : existing.metadata,
    allowDownload: patch.allowDownload ?? existing.allowDownload,
    expiresAt: patch.expiresAt ?? existing.expiresAt,
    maxViews: patch.maxViews ?? existing.maxViews,
    status: patch.status ?? existing.status,
  });
}

export async function regenerateShareLinkToken(
  linkId: string,
  tenantId: string,
  ctx: FilesServiceContext,
): Promise<FileShareLink> {
  await assertTenantAccess(tenantId);
  const existing = await q.getShareLink(linkId, tenantId);
  if (!existing) throw new Error("NOT_FOUND");
  if (existing.fileId) {
    const file = await q.getFile(existing.fileId, tenantId);
    if (!file) throw new Error("NOT_FOUND");
    const folder = file.folderId
      ? await q.getFolder(file.folderId, tenantId)
      : null;
    assertCanShare({ file, folder, context: ctx });
  } else if (existing.folderId) {
    if (ctx.role !== "admin" && ctx.role !== "director") {
      throw new Error("FORBIDDEN");
    }
  }
  return q.upsertShareLink(tenantId, {
    id: linkId,
    token: shareToken(),
    viewCount: 0,
    status: "active",
    allowDownload: existing.allowDownload,
    expiresAt: existing.expiresAt,
    maxViews: existing.maxViews,
    passwordHash: existing.passwordHash,
    metadata: {
      ...existing.metadata,
      lastRegeneratedAt: nowIso(),
    },
  });
}

export async function viewShareLink(
  token: string,
  opts: { password?: string | null } = {},
): Promise<{
  link: FileShareLink;
  file: FileObject | null;
  folder: FileFolder | null;
  signedUrl: FileSignedUrl | null;
}> {
  const link = await q.getShareLinkByToken(token);
  if (!link) throw new Error("NOT_FOUND");
  const evaluation = evaluateShareLink(link, opts);
  if (!evaluation.allowed) {
    throw new Error(`FORBIDDEN: ${evaluation.reason ?? "Access denied"}`);
  }

  const tenantId = link.tenantId;
  let file: FileObject | null = null;
  let folder: FileFolder | null = null;
  let signedUrl: FileSignedUrl | null = null;

  if (link.fileId) {
    file = await q.getFile(link.fileId, tenantId);
    if (file) {
      folder = file.folderId ? await q.getFolder(file.folderId, tenantId) : null;
      if (!publicShareLinkAllowedForFileInFolder(file, folder)) {
        throw new Error("FORBIDDEN: Share link cannot bypass folder ACL");
      }
    }
    if (file?.storageKey) {
      const signed = await createSignedUrlCached(tenantId, file.storageKey, {
        bucket: file.storageBucket ?? undefined,
        download: link.allowDownload,
      });
      signedUrl = {
        url: signed.url,
        expiresAt: signed.expiresAt,
        storageKey: file.storageKey,
        mimeType: file.mimeType,
        fileName: file.name,
      };
    }
  } else if (link.folderId) {
    folder = await q.getFolder(link.folderId, tenantId);
  }

  await q.incrementShareLinkViewCount(link.id, tenantId);
  const refreshed = (await q.getShareLink(link.id, tenantId)) ?? link;
  return { link: refreshed, file, folder, signedUrl };
}

export async function revokeShareLinkById(
  id: string,
  tenantId: string,
  ctx: FilesServiceContext,
): Promise<void> {
  await assertTenantAccess(tenantId);
  if (ctx.role !== "admin" && ctx.role !== "director") {
    const link = await q.getShareLink(id, tenantId);
    if (!link || link.createdBy !== ctx.userId) throw new Error("FORBIDDEN");
  }
  await q.revokeShareLink(id, tenantId);
}

// -------- Signature Requests --------

export async function createSignatureRequest(
  tenantId: string,
  input: SignatureRequestInput,
  ctx: FilesServiceContext,
): Promise<FileSignatureRequest> {
  await assertTenantAccess(tenantId);
  const file = await q.getFile(input.fileId, tenantId);
  if (!file) throw new Error("NOT_FOUND");
  const folder = file.folderId
    ? await q.getFolder(file.folderId, tenantId)
    : null;
  assertCanSign({ file, folder, context: ctx });

  const seed = buildSignatureRequest({
    tenantId,
    input: { ...input, createdBy: ctx.userId ?? input.createdBy ?? null },
  });
  const saved = await q.upsertSignatureRequest(tenantId, seed);
  await q.upsertFile(tenantId, {
    ...file,
    signatureStatus: saved.status,
  });
  return saved;
}

export async function getSignatureSurfaceByToken(
  token: string,
): Promise<SignatureSurface> {
  const request = await q.getSignatureRequestBySignerToken(token);
  if (!request) throw new Error("NOT_FOUND");
  if (request.status === "expired" || request.status === "completed") {
    // Still serve, but don't allow actions.
  }
  const file = await q.getFile(request.fileId, request.tenantId);
  if (!file) throw new Error("NOT_FOUND");
  const signer = findSignerByToken(request, token);
  return { request, file, signer };
}

export async function recordSignerView(
  token: string,
  ctx: { ip?: string | null; userAgent?: string | null } = {},
): Promise<FileSignatureRequest> {
  const request = await q.getSignatureRequestBySignerToken(token);
  if (!request) throw new Error("NOT_FOUND");
  if (isExpired(request.expiresAt)) {
    const expired = expireRequest(request);
    return q.upsertSignatureRequest(request.tenantId, expired);
  }
  const updated = markSignerViewed(request, token, ctx);
  return q.upsertSignatureRequest(request.tenantId, updated);
}

export async function recordFieldFill(
  token: string,
  fieldId: string,
  value: string,
  ctx: { ip?: string | null; userAgent?: string | null } = {},
): Promise<FileSignatureRequest> {
  const request = await q.getSignatureRequestBySignerToken(token);
  if (!request) throw new Error("NOT_FOUND");
  const updated = fillField(request, token, fieldId, value, ctx);
  return q.upsertSignatureRequest(request.tenantId, updated);
}

export async function recordSignerSignature(
  token: string,
  ctx: { ip?: string | null; userAgent?: string | null } = {},
): Promise<FileSignatureRequest> {
  const request = await q.getSignatureRequestBySignerToken(token);
  if (!request) throw new Error("NOT_FOUND");
  const updated = markSignerSigned(request, token, ctx);
  const saved = await q.upsertSignatureRequest(request.tenantId, updated);
  if (saved.status === "completed") {
    // Update file signature status
    const file = await q.getFile(saved.fileId, saved.tenantId);
    if (file) {
      await q.upsertFile(saved.tenantId, {
        ...file,
        signatureStatus: saved.status,
      });
    }
  }
  return saved;
}

export async function recordSignerDecline(
  token: string,
  reason: string | null,
  ctx: { ip?: string | null; userAgent?: string | null } = {},
): Promise<FileSignatureRequest> {
  const request = await q.getSignatureRequestBySignerToken(token);
  if (!request) throw new Error("NOT_FOUND");
  const updated = declineRequest(request, token, reason, ctx);
  return q.upsertSignatureRequest(request.tenantId, updated);
}

export async function getSignatureRequestDetail(
  requestId: string,
  tenantId: string,
  ctx: FilesServiceContext,
): Promise<{ request: FileSignatureRequest; file: FileObject }> {
  await assertTenantAccess(tenantId);
  const request = await q.getSignatureRequest(requestId, tenantId);
  if (!request) throw new Error("NOT_FOUND");
  const file = await q.getFile(request.fileId, tenantId);
  if (!file) throw new Error("NOT_FOUND");
  const folder = file.folderId ? await q.getFolder(file.folderId, tenantId) : null;
  assertCanRead({ file, folder, context: ctx });
  return { request, file };
}

export async function restoreFileToVersion(
  fileId: string,
  versionId: string,
  tenantId: string,
  ctx: FilesServiceContext,
): Promise<FileObject> {
  await assertTenantAccess(tenantId);
  const file = await q.getFile(fileId, tenantId);
  if (!file) throw new Error("NOT_FOUND");
  const folder = file.folderId ? await q.getFolder(file.folderId, tenantId) : null;
  assertCanWrite({ file, folder, context: ctx });
  const version = await q.getFileVersion(versionId, tenantId);
  if (!version || version.fileId !== fileId) throw new Error("NOT_FOUND");
  return q.upsertFile(tenantId, {
    ...file,
    id: fileId,
    mimeType: version.mimeType,
    size: version.size,
    storageKey: version.storageKey,
    storageBucket: version.storageBucket,
    checksum: version.checksum,
    currentVersionId: version.id,
    metadata: {
      ...file.metadata,
      lastRestoredVersion: version.version,
      lastRestoredAt: nowIso(),
    },
    updatedBy: ctx.userId,
  });
}

export async function deleteStoredFileVersion(
  fileId: string,
  versionId: string,
  tenantId: string,
  ctx: FilesServiceContext,
): Promise<void> {
  await assertTenantAccess(tenantId);
  const file = await q.getFile(fileId, tenantId);
  if (!file) throw new Error("NOT_FOUND");
  const folder = file.folderId ? await q.getFolder(file.folderId, tenantId) : null;
  assertCanWrite({ file, folder, context: ctx });
  const versions = await q.listVersions(fileId, tenantId);
  if (versions.length <= 1) {
    throw new Error("BAD_REQUEST: Cannot delete the only version");
  }
  const version = await q.getFileVersion(versionId, tenantId);
  if (!version || version.fileId !== fileId) throw new Error("NOT_FOUND");
  if (file.currentVersionId === versionId) {
    throw new Error(
      "BAD_REQUEST: Restore a different version before deleting the current revision",
    );
  }
  if (version.storageKey) {
    await deleteBlob(tenantId, version.storageKey, version.storageBucket ?? undefined);
  }
  await q.deleteFileVersionRecord(versionId, tenantId);
}

export async function buildAllVersionsZip(
  fileId: string,
  tenantId: string,
  ctx: FilesServiceContext,
): Promise<Uint8Array> {
  await assertTenantAccess(tenantId);
  const file = await q.getFile(fileId, tenantId);
  if (!file) throw new Error("NOT_FOUND");
  const folder = file.folderId
    ? await q.getFolder(file.folderId, tenantId)
    : null;
  assertCanRead({ file, folder, context: ctx });
  const versions = await q.listVersions(fileId, tenantId);
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  const base = file.name.replace(/[^\w.\-]+/g, "_") || "file";
  for (const v of versions) {
    const bytes = await readBlob(
      tenantId,
      v.storageKey,
      v.storageBucket ?? undefined,
    );
    if (!bytes) continue;
    zip.file(`${base}_v${v.version}`, bytes);
  }
  const out = await zip.generateAsync({ type: "uint8array" });
  return out;
}

export async function bulkDeleteFiles(
  fileIds: string[],
  tenantId: string,
  ctx: FilesServiceContext,
): Promise<void> {
  await Promise.all(
    fileIds.map((id) => deleteFileById(id, tenantId, ctx)),
  );
}

export async function bulkMoveFiles(
  fileIds: string[],
  folderId: string | null,
  tenantId: string,
  ctx: FilesServiceContext,
): Promise<void> {
  await Promise.all(
    fileIds.map((id) => updateFile(id, tenantId, { folderId }, ctx)),
  );
}

export async function sendSignatureReminder(
  requestId: string,
  signerId: string,
  tenantId: string,
  ctx: FilesServiceContext,
): Promise<FileSignatureRequest> {
  await assertTenantAccess(tenantId);
  const req = await q.getSignatureRequest(requestId, tenantId);
  if (!req) throw new Error("NOT_FOUND");
  const file = await q.getFile(req.fileId, tenantId);
  if (!file) throw new Error("NOT_FOUND");
  const folder = file.folderId
    ? await q.getFolder(file.folderId, tenantId)
    : null;
  assertCanSign({ file, folder, context: ctx });
  const signer = req.signers.find((s) => s.id === signerId);
  if (!signer) throw new Error("NOT_FOUND");
  const next = appendSignerReminder(req, signerId, {
    actor: ctx.userId ?? undefined,
  });
  return q.upsertSignatureRequest(tenantId, next);
}

export async function signedUrlForFileVersion(
  fileId: string,
  versionId: string,
  tenantId: string,
  ctx: FilesServiceContext,
  opts?: { ttlSeconds?: number; download?: boolean },
): Promise<FileSignedUrl> {
  await assertTenantAccess(tenantId);
  const file = await q.getFile(fileId, tenantId);
  if (!file) throw new Error("NOT_FOUND");
  const folder = file.folderId ? await q.getFolder(file.folderId, tenantId) : null;
  assertCanRead({ file, folder, context: ctx });
  const version = await q.getFileVersion(versionId, tenantId);
  if (!version || version.fileId !== fileId) throw new Error("NOT_FOUND");
  if (!version.storageKey) {
    return {
      url: "",
      expiresAt: nowIso(),
      storageKey: "",
      mimeType: version.mimeType,
      fileName: file.name,
    };
  }
  const signed = await createSignedUrlCached(tenantId, version.storageKey, {
    ttlSeconds: opts?.ttlSeconds,
    bucket: version.storageBucket ?? undefined,
    download: opts?.download,
  });
  return {
    url: signed.url,
    expiresAt: signed.expiresAt,
    storageKey: version.storageKey,
    mimeType: version.mimeType,
    fileName: file.name,
  };
}

// -------- File content stream for inline preview (internal) --------

export async function deleteFileAndStorage(
  fileId: string,
  tenantId: string,
  ctx: FilesServiceContext,
): Promise<void> {
  await assertTenantAccess(tenantId);
  const file = await q.getFile(fileId, tenantId);
  if (!file) return;
  const folder = file.folderId
    ? await q.getFolder(file.folderId, tenantId)
    : null;
  assertCanWrite({ file, folder, context: ctx });
  if (file.storageKey) {
    await deleteBlob(tenantId, file.storageKey, file.storageBucket ?? undefined);
  }
  await q.deleteFile(fileId, tenantId);
}
