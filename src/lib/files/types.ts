// Files & Documents OS — shared types.

export const FILE_VISIBILITIES = ["private", "tenant", "shared", "public"] as const;
export type FileVisibility = (typeof FILE_VISIBILITIES)[number];

export const FILE_STATUSES = ["active", "archived", "deleted"] as const;
export type FileStatus = (typeof FILE_STATUSES)[number];

export const SHARE_LINK_STATUSES = ["active", "revoked", "expired"] as const;
export type ShareLinkStatus = (typeof SHARE_LINK_STATUSES)[number];

export const SIGNATURE_STATUSES = [
  "pending",
  "viewed",
  "signed",
  "completed",
  "declined",
  "expired",
] as const;
export type SignatureStatus = (typeof SIGNATURE_STATUSES)[number];

export const SIGNATURE_FIELD_TYPES = [
  "text",
  "checkbox",
  "date",
  "signature-draw",
  "initials",
] as const;
export type SignatureFieldType = (typeof SIGNATURE_FIELD_TYPES)[number];

export const FILE_ACL_SCOPES = ["read", "write", "share"] as const;
export type FileAclScope = (typeof FILE_ACL_SCOPES)[number];

export interface FileAclEntry {
  principalType: "user" | "role" | "profile";
  principalId: string;
  scopes: FileAclScope[];
}

export interface FileObject {
  id: string;
  tenantId: string;
  folderId: string | null;
  ownerId: string | null;
  name: string;
  description: string | null;
  mimeType: string;
  size: number;
  extension: string | null;
  storageKey: string | null;
  storageBucket: string | null;
  checksum: string | null;
  visibility: FileVisibility;
  status: FileStatus;
  currentVersionId: string | null;
  thumbnailKey: string | null;
  virusScanStatus: "pending" | "clean" | "infected" | "skipped";
  signatureStatus: SignatureStatus | null;
  tags: string[];
  acl: FileAclEntry[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface FileVersion {
  id: string;
  tenantId: string;
  fileId: string;
  version: number;
  storageKey: string;
  storageBucket: string | null;
  size: number;
  mimeType: string;
  checksum: string | null;
  uploadedBy: string | null;
  notes: string | null;
  createdAt: string;
}

export interface FileFolder {
  id: string;
  tenantId: string;
  parentId: string | null;
  name: string;
  description: string | null;
  path: string;
  ownerId: string | null;
  visibility: FileVisibility;
  acl: FileAclEntry[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface FileShareLink {
  id: string;
  tenantId: string;
  fileId: string | null;
  folderId: string | null;
  token: string;
  status: ShareLinkStatus;
  passwordHash: string | null;
  expiresAt: string | null;
  maxViews: number | null;
  viewCount: number;
  allowDownload: boolean;
  /** Extra flags: linkDisabled, watermarkPreview, etc. */
  metadata: Record<string, unknown>;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FileSignatureField {
  id: string;
  type: SignatureFieldType;
  label: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Degrees clockwise; used when placing fields on PDF preview */
  rotation?: number;
  required: boolean;
  value: string | null;
  signedAt: string | null;
}

export interface FileSignatureSigner {
  id: string;
  name: string;
  email: string;
  profileId: string | null;
  order: number;
  status: SignatureStatus;
  viewedAt: string | null;
  signedAt: string | null;
  ip: string | null;
  userAgent: string | null;
  token: string;
}

export interface FileSignatureAuditEntry {
  at: string;
  actor: string;
  event:
    | "created"
    | "sent"
    | "viewed"
    | "field_filled"
    | "signed"
    | "completed"
    | "declined"
    | "expired"
    | "reminder_sent";
  ip: string | null;
  userAgent: string | null;
  details: Record<string, unknown>;
}

export interface FileSignatureRequest {
  id: string;
  tenantId: string;
  fileId: string;
  title: string;
  message: string | null;
  status: SignatureStatus;
  signers: FileSignatureSigner[];
  fields: FileSignatureField[];
  audit: FileSignatureAuditEntry[];
  certificateKey: string | null;
  completedAt: string | null;
  expiresAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FileInput {
  name: string;
  description?: string | null;
  folderId?: string | null;
  mimeType?: string;
  size?: number;
  extension?: string | null;
  storageKey?: string | null;
  storageBucket?: string | null;
  checksum?: string | null;
  visibility?: FileVisibility;
  status?: FileStatus;
  thumbnailKey?: string | null;
  tags?: string[];
  acl?: FileAclEntry[];
  metadata?: Record<string, unknown>;
  ownerId?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface FileFolderInput {
  name: string;
  parentId?: string | null;
  description?: string | null;
  path?: string;
  ownerId?: string | null;
  visibility?: FileVisibility;
  acl?: FileAclEntry[];
  metadata?: Record<string, unknown>;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface FileShareLinkInput {
  fileId?: string | null;
  folderId?: string | null;
  expiresInSeconds?: number | null;
  maxViews?: number | null;
  password?: string | null;
  allowDownload?: boolean;
  createdBy?: string | null;
  /** Merged into share link metadata (e.g. watermarkPreview) */
  metadata?: Record<string, unknown>;
}

export interface SignatureRequestInput {
  fileId: string;
  title: string;
  message?: string | null;
  signers: Array<Omit<FileSignatureSigner, "id" | "status" | "viewedAt" | "signedAt" | "ip" | "userAgent" | "token"> & { id?: string }>;
  fields: Array<Omit<FileSignatureField, "id" | "value" | "signedAt"> & { id?: string }>;
  expiresAt?: string | null;
  createdBy?: string | null;
}

export interface FileUploadPayload {
  fileName: string;
  mimeType: string;
  size: number;
  base64: string; // data (without data: prefix) or URL-safe base64
  checksum?: string | null;
  notes?: string | null;
}

export interface FileSignedUrl {
  url: string;
  expiresAt: string;
  storageKey: string;
  mimeType: string;
  fileName: string;
}

export interface FilesDashboardData {
  files: FileObject[];
  folders: FileFolder[];
  recent: FileObject[];
  signatureRequests: FileSignatureRequest[];
  shareLinks: FileShareLink[];
  kpis: FilesKpiSummary;
  generatedAt: string;
}

export interface FilesKpiSummary {
  totalFiles: number;
  totalFolders: number;
  storageBytes: number;
  activeShareLinks: number;
  pendingSignatures: number;
  completedSignatures: number;
  filesThisWeek: number;
}

export interface FileSurface {
  file: FileObject;
  folder: FileFolder | null;
  versions: FileVersion[];
  shareLinks: FileShareLink[];
  signatureRequests: FileSignatureRequest[];
  permissions: FilePermissionSummary;
}

export interface FilePermissionSummary {
  canRead: boolean;
  canWrite: boolean;
  canShare: boolean;
  canSign: boolean;
  reason: string | null;
  /** Short explanations when a capability is unavailable (ACL, role, link rules, …) */
  hints?: {
    read?: string | null;
    write?: string | null;
    share?: string | null;
    sign?: string | null;
  };
}

export interface FolderSurface {
  folder: FileFolder;
  files: FileObject[];
  subfolders: FileFolder[];
  permissions: FilePermissionSummary;
}

export interface SignatureSurface {
  request: FileSignatureRequest;
  file: FileObject;
  signer: FileSignatureSigner | null;
}

export interface FilePermissionContext {
  source?: string;
  role: string;
  userId: string | null;
  profileId: string | null;
  tenantId: string;
}
