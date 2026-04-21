// Query-layer mapping between @data rows and domain types.
import * as filesData from "@data/files";
import * as foldersData from "@data/fileFolders";
import * as versionsData from "@data/fileVersions";
import * as shareData from "@data/fileShareLinks";
import * as sigData from "@data/fileSignatureRequests";
function toFile(row) {
    var _a, _b, _c, _d;
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
        signatureStatus: (_a = row.signature_status) !== null && _a !== void 0 ? _a : null,
        tags: (_b = row.tags) !== null && _b !== void 0 ? _b : [],
        acl: ((_c = row.acl) !== null && _c !== void 0 ? _c : []),
        metadata: ((_d = row.metadata) !== null && _d !== void 0 ? _d : {}),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: row.created_by,
        updatedBy: row.updated_by,
    };
}
function toFolder(row) {
    var _a, _b;
    return {
        id: row.id,
        tenantId: row.tenant_id,
        parentId: row.parent_id,
        name: row.name,
        description: row.description,
        path: row.path,
        ownerId: row.owner_id,
        visibility: row.visibility,
        acl: ((_a = row.acl) !== null && _a !== void 0 ? _a : []),
        metadata: ((_b = row.metadata) !== null && _b !== void 0 ? _b : {}),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: row.created_by,
        updatedBy: row.updated_by,
    };
}
function toVersion(row) {
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
function toShareLink(row) {
    var _a;
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
        metadata: ((_a = row.metadata) !== null && _a !== void 0 ? _a : {}),
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
function toSignatureRequest(row) {
    var _a, _b, _c;
    return {
        id: row.id,
        tenantId: row.tenant_id,
        fileId: row.file_id,
        title: row.title,
        message: row.message,
        status: row.status,
        signers: ((_a = row.signers) !== null && _a !== void 0 ? _a : []),
        fields: ((_b = row.fields) !== null && _b !== void 0 ? _b : []),
        audit: ((_c = row.audit) !== null && _c !== void 0 ? _c : []),
        certificateKey: row.certificate_key,
        completedAt: row.completed_at,
        expiresAt: row.expires_at,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
// -------- Files --------
export async function listFiles(tenantId, filter) {
    const rows = await filesData.listFiles(tenantId, filter);
    return rows.map(toFile);
}
export async function getFile(id, tenantId) {
    const row = await filesData.getFile(id, tenantId);
    return row ? toFile(row) : null;
}
export async function findFileByFolderAndName(tenantId, folderId, name) {
    const row = await filesData.findFileByFolderAndName(tenantId, folderId, name);
    return row ? toFile(row) : null;
}
export async function upsertFile(tenantId, input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    const row = await filesData.upsertFile(tenantId, {
        id: input.id,
        name: input.name,
        description: (_a = input.description) !== null && _a !== void 0 ? _a : undefined,
        folder_id: (_b = input.folderId) !== null && _b !== void 0 ? _b : null,
        owner_id: (_c = input.ownerId) !== null && _c !== void 0 ? _c : null,
        mime_type: input.mimeType,
        size: input.size,
        extension: (_d = input.extension) !== null && _d !== void 0 ? _d : null,
        storage_key: (_e = input.storageKey) !== null && _e !== void 0 ? _e : null,
        storage_bucket: (_f = input.storageBucket) !== null && _f !== void 0 ? _f : null,
        checksum: (_g = input.checksum) !== null && _g !== void 0 ? _g : null,
        visibility: input.visibility,
        status: input.status,
        current_version_id: (_h = input.currentVersionId) !== null && _h !== void 0 ? _h : null,
        thumbnail_key: (_j = input.thumbnailKey) !== null && _j !== void 0 ? _j : null,
        virus_scan_status: input.virusScanStatus,
        signature_status: (_k = input.signatureStatus) !== null && _k !== void 0 ? _k : null,
        tags: input.tags,
        acl: input.acl,
        metadata: (_l = input.metadata) !== null && _l !== void 0 ? _l : undefined,
        created_by: (_m = input.createdBy) !== null && _m !== void 0 ? _m : null,
        updated_by: (_o = input.updatedBy) !== null && _o !== void 0 ? _o : null,
    });
    return toFile(row);
}
export async function deleteFile(id, tenantId) {
    await filesData.deleteFile(id, tenantId);
}
// -------- Folders --------
export async function listFolders(tenantId, parentId) {
    const rows = await foldersData.listFolders(tenantId, parentId);
    return rows.map(toFolder);
}
export async function getFolder(id, tenantId) {
    const row = await foldersData.getFolder(id, tenantId);
    return row ? toFolder(row) : null;
}
export async function upsertFolder(tenantId, input) {
    var _a, _b, _c, _d, _e, _f;
    const row = await foldersData.upsertFolder(tenantId, {
        id: input.id,
        name: input.name,
        parent_id: (_a = input.parentId) !== null && _a !== void 0 ? _a : null,
        description: (_b = input.description) !== null && _b !== void 0 ? _b : null,
        path: input.path,
        owner_id: (_c = input.ownerId) !== null && _c !== void 0 ? _c : null,
        visibility: input.visibility,
        acl: input.acl,
        metadata: (_d = input.metadata) !== null && _d !== void 0 ? _d : undefined,
        created_by: (_e = input.createdBy) !== null && _e !== void 0 ? _e : null,
        updated_by: (_f = input.updatedBy) !== null && _f !== void 0 ? _f : null,
    });
    return toFolder(row);
}
export async function deleteFolder(id, tenantId) {
    await foldersData.deleteFolder(id, tenantId);
}
// -------- Versions --------
export async function listVersions(fileId, tenantId) {
    const rows = await versionsData.listFileVersions(fileId, tenantId);
    return rows.map(toVersion);
}
export async function createVersion(tenantId, input) {
    var _a, _b, _c;
    const row = await versionsData.createFileVersion(tenantId, {
        file_id: input.fileId,
        version: input.version,
        storage_key: input.storageKey,
        storage_bucket: input.storageBucket,
        size: input.size,
        mime_type: input.mimeType,
        checksum: (_a = input.checksum) !== null && _a !== void 0 ? _a : null,
        uploaded_by: (_b = input.uploadedBy) !== null && _b !== void 0 ? _b : null,
        notes: (_c = input.notes) !== null && _c !== void 0 ? _c : null,
    });
    return toVersion(row);
}
export async function getFileVersion(id, tenantId) {
    const row = await versionsData.getFileVersion(id, tenantId);
    return row ? toVersion(row) : null;
}
export async function deleteFileVersionRecord(id, tenantId) {
    await versionsData.deleteFileVersion(id, tenantId);
}
// -------- Share links --------
export async function listShareLinks(tenantId, filter) {
    const rows = await shareData.listShareLinks(tenantId, filter);
    return rows.map(toShareLink);
}
export async function getShareLink(id, tenantId) {
    const row = await shareData.getShareLink(id, tenantId);
    return row ? toShareLink(row) : null;
}
export async function getShareLinkByToken(token) {
    const row = await shareData.getShareLinkByToken(token);
    return row ? toShareLink(row) : null;
}
export async function upsertShareLink(tenantId, input) {
    var _a, _b, _c, _d, _e, _f, _g;
    const row = await shareData.upsertShareLink(tenantId, {
        id: input.id,
        file_id: (_a = input.fileId) !== null && _a !== void 0 ? _a : null,
        folder_id: (_b = input.folderId) !== null && _b !== void 0 ? _b : null,
        token: input.token,
        status: input.status,
        password_hash: (_c = input.passwordHash) !== null && _c !== void 0 ? _c : null,
        expires_at: (_d = input.expiresAt) !== null && _d !== void 0 ? _d : null,
        max_views: (_e = input.maxViews) !== null && _e !== void 0 ? _e : null,
        view_count: input.viewCount,
        allow_download: input.allowDownload,
        metadata: (_f = input.metadata) !== null && _f !== void 0 ? _f : undefined,
        created_by: (_g = input.createdBy) !== null && _g !== void 0 ? _g : null,
    });
    return toShareLink(row);
}
export async function incrementShareLinkViewCount(id, tenantId) {
    const row = await shareData.incrementShareLinkViewCount(id, tenantId);
    return row ? toShareLink(row) : null;
}
export async function revokeShareLink(id, tenantId) {
    await shareData.revokeShareLink(id, tenantId);
}
// -------- Signature requests --------
export async function listSignatureRequests(tenantId, filter) {
    const rows = await sigData.listSignatureRequests(tenantId, filter);
    return rows.map(toSignatureRequest);
}
export async function getSignatureRequest(id, tenantId) {
    const row = await sigData.getSignatureRequest(id, tenantId);
    return row ? toSignatureRequest(row) : null;
}
export async function getSignatureRequestBySignerToken(token) {
    const row = await sigData.getSignatureRequestBySignerToken(token);
    return row ? toSignatureRequest(row) : null;
}
export async function upsertSignatureRequest(tenantId, request) {
    const row = await sigData.upsertSignatureRequest(tenantId, {
        id: request.id,
        file_id: request.fileId,
        title: request.title,
        message: request.message,
        status: request.status,
        signers: request.signers,
        fields: request.fields,
        audit: request.audit,
        certificate_key: request.certificateKey,
        completed_at: request.completedAt,
        expires_at: request.expiresAt,
        created_by: request.createdBy,
    });
    return toSignatureRequest(row);
}
