// Query-layer mapping between @data rows and domain types.

import * as filesData from "@data/files";
import * as foldersData from "@data/fileFolders";
import * as versionsData from "@data/fileVersions";
import * as shareData from "@data/fileShareLinks";
import * as sigData from "@data/fileSignatureRequests";
import type {
  FileAclEntry,
  FileFolder,
  FileFolderInput,
  FileInput,
  FileObject,
  FileShareLink,
  FileShareLinkInput,
  FileSignatureAuditEntry,
  FileSignatureField,
  FileSignatureRequest,
  FileSignatureSigner,
  FileVersion,
  SignatureRequestInput,
} from "./types";

function toFile(row: filesData.FileObjectRow): FileObject {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    folderId: row.folder_id,
    ownerId: row.owner_id,
    name: row.name,
    description: row.description,
    mimeType: row.mime_type,
    size: row.size,
    extension: row.extension,
    storageKey: row.storage_key,
    storageBucket: row.storage_bucket,
    checksum: row.checksum,
    visibility: row.visibility,
    status: row.status,
    currentVersionId: row.current_version_id,
    thumbnailKey: row.thumbnail_key,
    virusScanStatus: row.virus_scan_status,
    signatureStatus: (row.signature_status as FileObject["signatureStatus"]) ?? null,
    tags: row.tags ?? [],
    acl: (row.acl ?? []) as unknown as FileAclEntry[],
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

function toFolder(row: foldersData.FileFolderRow): FileFolder {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    parentId: row.parent_id,
    name: row.name,
    description: row.description,
    path: row.path,
    ownerId: row.owner_id,
    visibility: row.visibility,
    acl: (row.acl ?? []) as unknown as FileAclEntry[],
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

function toVersion(row: versionsData.FileVersionRow): FileVersion {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    fileId: row.file_id,
    version: row.version,
    storageKey: row.storage_key,
    storageBucket: row.storage_bucket,
    size: row.size,
    mimeType: row.mime_type,
    checksum: row.checksum,
    uploadedBy: row.uploaded_by,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function toShareLink(row: shareData.FileShareLinkRow): FileShareLink {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    fileId: row.file_id,
    folderId: row.folder_id,
    token: row.token,
    status: row.status,
    passwordHash: row.password_hash,
    expiresAt: row.expires_at,
    maxViews: row.max_views,
    viewCount: row.view_count,
    allowDownload: row.allow_download,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toSignatureRequest(
  row: sigData.FileSignatureRequestRow,
): FileSignatureRequest {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    fileId: row.file_id,
    title: row.title,
    message: row.message,
    status: row.status,
    signers: (row.signers ?? []) as unknown as FileSignatureSigner[],
    fields: (row.fields ?? []) as unknown as FileSignatureField[],
    audit: (row.audit ?? []) as unknown as FileSignatureAuditEntry[],
    certificateKey: row.certificate_key,
    completedAt: row.completed_at,
    expiresAt: row.expires_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// -------- Files --------

export async function listFiles(
  tenantId: string,
  filter?: filesData.FileListFilter,
): Promise<FileObject[]> {
  const rows = await filesData.listFiles(tenantId, filter);
  return rows.map(toFile);
}

export async function getFile(
  id: string,
  tenantId: string,
): Promise<FileObject | null> {
  const row = await filesData.getFile(id, tenantId);
  return row ? toFile(row) : null;
}

export async function findFileByFolderAndName(
  tenantId: string,
  folderId: string | null,
  name: string,
): Promise<FileObject | null> {
  const row = await filesData.findFileByFolderAndName(tenantId, folderId, name);
  return row ? toFile(row) : null;
}

export async function upsertFile(
  tenantId: string,
  input: Partial<FileObject> & { id?: string; name?: string },
): Promise<FileObject> {
  const row = await filesData.upsertFile(tenantId, {
    id: input.id,
    name: input.name,
    description: input.description ?? undefined,
    folder_id: input.folderId ?? null,
    owner_id: input.ownerId ?? null,
    mime_type: input.mimeType,
    size: input.size,
    extension: input.extension ?? null,
    storage_key: input.storageKey ?? null,
    storage_bucket: input.storageBucket ?? null,
    checksum: input.checksum ?? null,
    visibility: input.visibility,
    status: input.status,
    current_version_id: input.currentVersionId ?? null,
    thumbnail_key: input.thumbnailKey ?? null,
    virus_scan_status: input.virusScanStatus,
    signature_status: input.signatureStatus ?? null,
    tags: input.tags,
    acl: input.acl as unknown as Array<Record<string, unknown>> | undefined,
    metadata: input.metadata ?? undefined,
    created_by: input.createdBy ?? null,
    updated_by: input.updatedBy ?? null,
  });
  return toFile(row);
}

export async function deleteFile(id: string, tenantId: string): Promise<void> {
  await filesData.deleteFile(id, tenantId);
}

// -------- Folders --------

export async function listFolders(
  tenantId: string,
  parentId?: string | null,
): Promise<FileFolder[]> {
  const rows = await foldersData.listFolders(tenantId, parentId);
  return rows.map(toFolder);
}

export async function getFolder(
  id: string,
  tenantId: string,
): Promise<FileFolder | null> {
  const row = await foldersData.getFolder(id, tenantId);
  return row ? toFolder(row) : null;
}

export async function upsertFolder(
  tenantId: string,
  input: Partial<FileFolder> & { id?: string; name?: string },
): Promise<FileFolder> {
  const row = await foldersData.upsertFolder(tenantId, {
    id: input.id,
    name: input.name,
    parent_id: input.parentId ?? null,
    description: input.description ?? null,
    path: input.path,
    owner_id: input.ownerId ?? null,
    visibility: input.visibility,
    acl: input.acl as unknown as Array<Record<string, unknown>> | undefined,
    metadata: input.metadata ?? undefined,
    created_by: input.createdBy ?? null,
    updated_by: input.updatedBy ?? null,
  });
  return toFolder(row);
}

export async function deleteFolder(
  id: string,
  tenantId: string,
): Promise<void> {
  await foldersData.deleteFolder(id, tenantId);
}

// -------- Versions --------

export async function listVersions(
  fileId: string,
  tenantId: string,
): Promise<FileVersion[]> {
  const rows = await versionsData.listFileVersions(fileId, tenantId);
  return rows.map(toVersion);
}

export async function createVersion(
  tenantId: string,
  input: Omit<FileVersion, "id" | "tenantId" | "createdAt" | "version"> & {
    version?: number;
  },
): Promise<FileVersion> {
  const row = await versionsData.createFileVersion(tenantId, {
    file_id: input.fileId,
    version: input.version,
    storage_key: input.storageKey,
    storage_bucket: input.storageBucket,
    size: input.size,
    mime_type: input.mimeType,
    checksum: input.checksum ?? null,
    uploaded_by: input.uploadedBy ?? null,
    notes: input.notes ?? null,
  });
  return toVersion(row);
}

export async function getFileVersion(
  id: string,
  tenantId: string,
): Promise<FileVersion | null> {
  const row = await versionsData.getFileVersion(id, tenantId);
  return row ? toVersion(row) : null;
}

export async function deleteFileVersionRecord(
  id: string,
  tenantId: string,
): Promise<void> {
  await versionsData.deleteFileVersion(id, tenantId);
}

// -------- Share links --------

export async function listShareLinks(
  tenantId: string,
  filter?: Parameters<typeof shareData.listShareLinks>[1],
): Promise<FileShareLink[]> {
  const rows = await shareData.listShareLinks(tenantId, filter);
  return rows.map(toShareLink);
}

export async function getShareLink(
  id: string,
  tenantId: string,
): Promise<FileShareLink | null> {
  const row = await shareData.getShareLink(id, tenantId);
  return row ? toShareLink(row) : null;
}

export async function getShareLinkByToken(
  token: string,
): Promise<FileShareLink | null> {
  const row = await shareData.getShareLinkByToken(token);
  return row ? toShareLink(row) : null;
}

export async function upsertShareLink(
  tenantId: string,
  input: Partial<FileShareLink> & { id?: string },
): Promise<FileShareLink> {
  const row = await shareData.upsertShareLink(tenantId, {
    id: input.id,
    file_id: input.fileId ?? null,
    folder_id: input.folderId ?? null,
    token: input.token,
    status: input.status,
    password_hash: input.passwordHash ?? null,
    expires_at: input.expiresAt ?? null,
    max_views: input.maxViews ?? null,
    view_count: input.viewCount,
    allow_download: input.allowDownload,
    metadata: input.metadata ?? undefined,
    created_by: input.createdBy ?? null,
  });
  return toShareLink(row);
}

export async function incrementShareLinkViewCount(
  id: string,
  tenantId: string,
): Promise<FileShareLink | null> {
  const row = await shareData.incrementShareLinkViewCount(id, tenantId);
  return row ? toShareLink(row) : null;
}

export async function revokeShareLink(
  id: string,
  tenantId: string,
): Promise<void> {
  await shareData.revokeShareLink(id, tenantId);
}

// -------- Signature requests --------

export async function listSignatureRequests(
  tenantId: string,
  filter?: Parameters<typeof sigData.listSignatureRequests>[1],
): Promise<FileSignatureRequest[]> {
  const rows = await sigData.listSignatureRequests(tenantId, filter);
  return rows.map(toSignatureRequest);
}

export async function getSignatureRequest(
  id: string,
  tenantId: string,
): Promise<FileSignatureRequest | null> {
  const row = await sigData.getSignatureRequest(id, tenantId);
  return row ? toSignatureRequest(row) : null;
}

export async function getSignatureRequestBySignerToken(
  token: string,
): Promise<FileSignatureRequest | null> {
  const row = await sigData.getSignatureRequestBySignerToken(token);
  return row ? toSignatureRequest(row) : null;
}

export async function upsertSignatureRequest(
  tenantId: string,
  request: FileSignatureRequest,
): Promise<FileSignatureRequest> {
  const row = await sigData.upsertSignatureRequest(tenantId, {
    id: request.id,
    file_id: request.fileId,
    title: request.title,
    message: request.message,
    status: request.status,
    signers: request.signers as unknown as Array<Record<string, unknown>>,
    fields: request.fields as unknown as Array<Record<string, unknown>>,
    audit: request.audit as unknown as Array<Record<string, unknown>>,
    certificate_key: request.certificateKey,
    completed_at: request.completedAt,
    expires_at: request.expiresAt,
    created_by: request.createdBy,
  });
  return toSignatureRequest(row);
}

// -------- Helpers for service layer --------

export type CreateFileSeed = Omit<FileInput, "name"> & { name: string };
export type CreateFolderSeed = Omit<FileFolderInput, "name"> & { name: string };
export type CreateShareLinkSeed = FileShareLinkInput;
export type CreateSignatureSeed = SignatureRequestInput;
