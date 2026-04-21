// Service layer for Files OS. Orchestrates queries + engines + KPIs.
import { assertTenantAccess } from "@/lib/auth/guards";
import { createSignedUrlCached, decodeBase64, deleteBlob, extensionFromName, generateThumbnail, isExpired, resolveMimeType, scanForVirus, uploadBlobWithIntegrityRetry, readBlob, } from "./storage";
import { assertCanDeleteFolder, assertCanRead, assertCanShare, assertCanSign, assertCanWrite, assertCanWriteFolder, assertCanWriteFolderHierarchy, computeFilePermissions, computeFolderAccessPermissions, evaluateShareLink, hashPassword, publicShareLinkAllowedForFileInFolder, roleDefaultVisibility, } from "./permissionsEngine";
import { appendSignerReminder, buildSignatureRequest, declineRequest, expireRequest, fillField, findSignerByToken, markSignerSigned, markSignerViewed, } from "./signatureEngine";
import { recordUsage } from "@/lib/billing/billingOps";
import * as q from "./queries";
function nowIso() {
    return new Date().toISOString();
}
function uuid() {
    const c = globalThis.crypto;
    if (c === null || c === void 0 ? void 0 : c.randomUUID)
        return c.randomUUID();
    return `file_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}
function shareToken() {
    return uuid().replace(/-/g, "").slice(0, 32);
}
function sevenDaysAgoIso() {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 7);
    return d.toISOString();
}
function computeFilesKpis(files, folders, shareLinks, signatureRequests) {
    const storageBytes = files.reduce((a, f) => { var _a; return a + ((_a = f.size) !== null && _a !== void 0 ? _a : 0); }, 0);
    const sevenDaysAgo = sevenDaysAgoIso();
    const activeShareLinks = shareLinks.filter((l) => l.status === "active" &&
        !isExpired(l.expiresAt) &&
        (l.maxViews === null || l.viewCount < l.maxViews)).length;
    const pendingSignatures = signatureRequests.filter((r) => r.status === "pending" || r.status === "viewed" || r.status === "signed").length;
    const completedSignatures = signatureRequests.filter((r) => r.status === "completed").length;
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
export function buildContextFromSession(session) {
    var _a, _b;
    return {
        role: session.role,
        userId: (_a = session.userId) !== null && _a !== void 0 ? _a : null,
        profileId: (_b = session.userId) !== null && _b !== void 0 ? _b : null,
        tenantId: session.tenantId,
    };
}
// -------- Dashboard & Surfaces --------
export async function getFilesDashboard(tenantId) {
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
export async function getFileSurface(fileId, tenantId, ctx) {
    await assertTenantAccess(tenantId);
    const file = await q.getFile(fileId, tenantId);
    if (!file)
        throw new Error("NOT_FOUND");
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
export async function getFolderSurface(folderId, tenantId, ctx) {
    await assertTenantAccess(tenantId);
    const folder = await q.getFolder(folderId, tenantId);
    if (!folder)
        throw new Error("NOT_FOUND");
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
export async function createFile({ tenantId, input, upload, context, }) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x;
    await assertTenantAccess(tenantId);
    const role = context.role;
    const trimmedName = (((_a = input.name) === null || _a === void 0 ? void 0 : _a.trim()) || ((_b = upload === null || upload === void 0 ? void 0 : upload.fileName) === null || _b === void 0 ? void 0 : _b.trim()) || "");
    if (upload && trimmedName) {
        const existing = await q.findFileByFolderAndName(tenantId, (_c = input.folderId) !== null && _c !== void 0 ? _c : null, trimmedName);
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
                mimeType: (_d = input.mimeType) !== null && _d !== void 0 ? _d : "application/octet-stream",
                size: 0,
                extension: null,
                storageKey: null,
                storageBucket: null,
                checksum: null,
                visibility: (_e = input.visibility) !== null && _e !== void 0 ? _e : roleDefaultVisibility(role),
                status: "active",
                currentVersionId: null,
                thumbnailKey: null,
                virusScanStatus: "skipped",
                signatureStatus: null,
                tags: [],
                acl: ((_f = input.acl) !== null && _f !== void 0 ? _f : []),
                metadata: {},
                createdAt: nowIso(),
                updatedAt: nowIso(),
                createdBy: context.userId,
                updatedBy: context.userId,
            },
            folder,
            context,
        });
    }
    else if (role !== "admin" && role !== "director" && role !== "teacher") {
        throw new Error("FORBIDDEN");
    }
    const visibility = (_g = input.visibility) !== null && _g !== void 0 ? _g : roleDefaultVisibility(role);
    const fileId = uuid();
    let mimeType = (_h = input.mimeType) !== null && _h !== void 0 ? _h : "application/octet-stream";
    let size = (_j = input.size) !== null && _j !== void 0 ? _j : 0;
    let storageKey = (_k = input.storageKey) !== null && _k !== void 0 ? _k : null;
    let storageBucket = (_l = input.storageBucket) !== null && _l !== void 0 ? _l : null;
    let checksum = (_m = input.checksum) !== null && _m !== void 0 ? _m : null;
    let thumbnailKey = (_o = input.thumbnailKey) !== null && _o !== void 0 ? _o : null;
    let virusScanStatus = "skipped";
    let currentVersionId = null;
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
            notes: (_p = upload.notes) !== null && _p !== void 0 ? _p : null,
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
        description: (_q = input.description) !== null && _q !== void 0 ? _q : null,
        folderId: (_r = input.folderId) !== null && _r !== void 0 ? _r : null,
        ownerId: (_s = input.ownerId) !== null && _s !== void 0 ? _s : context.userId,
        mimeType,
        size,
        extension: (_t = input.extension) !== null && _t !== void 0 ? _t : extensionFromName(input.name),
        storageKey,
        storageBucket,
        checksum,
        visibility,
        status: (_u = input.status) !== null && _u !== void 0 ? _u : "active",
        currentVersionId,
        thumbnailKey,
        virusScanStatus,
        tags: (_v = input.tags) !== null && _v !== void 0 ? _v : [],
        acl: ((_w = input.acl) !== null && _w !== void 0 ? _w : []),
        metadata: (_x = input.metadata) !== null && _x !== void 0 ? _x : {},
        createdBy: context.userId,
        updatedBy: context.userId,
    });
    try {
        const { evaluateTriggers } = await import("@/lib/automation/workflows/automationOps");
        await evaluateTriggers({
            tenantId,
            triggerType: "file.uploaded",
            payload: {
                fileId: created.id,
                folderId: created.folderId,
                name: created.name,
                mimeType: created.mimeType,
                size: created.size,
            },
            triggeredBy: context.userId,
        });
    }
    catch (_y) {
        /* noop */
    }
    return created;
}
export async function updateFile(fileId, tenantId, patch, ctx) {
    await assertTenantAccess(tenantId);
    const existing = await q.getFile(fileId, tenantId);
    if (!existing)
        throw new Error("NOT_FOUND");
    const folder = existing.folderId
        ? await q.getFolder(existing.folderId, tenantId)
        : null;
    assertCanWrite({ file: existing, folder, context: ctx });
    return q.upsertFile(tenantId, Object.assign(Object.assign(Object.assign({}, existing), patch), { id: fileId, updatedBy: ctx.userId }));
}
export async function deleteFileById(fileId, tenantId, ctx) {
    await assertTenantAccess(tenantId);
    const existing = await q.getFile(fileId, tenantId);
    if (!existing)
        throw new Error("NOT_FOUND");
    const folder = existing.folderId
        ? await q.getFolder(existing.folderId, tenantId)
        : null;
    assertCanWrite({ file: existing, folder, context: ctx });
    await q.deleteFile(fileId, tenantId);
}
export async function uploadNewVersion(fileId, tenantId, upload, ctx) {
    var _a, _b, _c;
    await assertTenantAccess(tenantId);
    const file = await q.getFile(fileId, tenantId);
    if (!file)
        throw new Error("NOT_FOUND");
    const folder = file.folderId
        ? await q.getFolder(file.folderId, tenantId)
        : null;
    assertCanWrite({ file, folder, context: ctx });
    const bytes = decodeBase64(upload.base64);
    let mimeType = resolveMimeType(upload.fileName, upload.mimeType, bytes);
    const virusScan = await scanForVirus(bytes);
    const previousVersions = await q.listVersions(fileId, tenantId);
    const nextVersion = ((_b = (_a = previousVersions[0]) === null || _a === void 0 ? void 0 : _a.version) !== null && _b !== void 0 ? _b : 0) + 1 || 1;
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
        notes: (_c = upload.notes) !== null && _c !== void 0 ? _c : null,
    });
    await recordUsage({
        tenantId,
        metric: "storage",
        amount: bytes.length,
        source: "files",
        metadata: { fileId, versionId: version.id, version: nextVersion },
    }).catch(() => null);
    return q.upsertFile(tenantId, Object.assign(Object.assign({}, file), { id: fileId, mimeType, size: bytes.length, storageKey: stored.storageKey, storageBucket: stored.storageBucket, checksum,
        thumbnailKey, virusScanStatus: virusScan, currentVersionId: version.id, updatedBy: ctx.userId }));
}
export async function createSignedFileUrl(fileId, tenantId, ctx, opts) {
    var _a;
    await assertTenantAccess(tenantId);
    const file = await q.getFile(fileId, tenantId);
    if (!file)
        throw new Error("NOT_FOUND");
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
        ttlSeconds: opts === null || opts === void 0 ? void 0 : opts.ttlSeconds,
        bucket: (_a = file.storageBucket) !== null && _a !== void 0 ? _a : undefined,
        download: opts === null || opts === void 0 ? void 0 : opts.download,
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
async function assertValidFolderMove(folderId, newParentId, tenantId) {
    var _a;
    if (newParentId === null)
        return;
    if (newParentId === folderId)
        throw new Error("BAD_REQUEST: Invalid folder move");
    let walk = newParentId;
    const guard = new Set();
    while (walk) {
        if (walk === folderId) {
            throw new Error("BAD_REQUEST: Cannot move a folder into itself");
        }
        if (guard.has(walk))
            break;
        guard.add(walk);
        const f = await q.getFolder(walk, tenantId);
        walk = (_a = f === null || f === void 0 ? void 0 : f.parentId) !== null && _a !== void 0 ? _a : null;
    }
    const moving = await q.getFolder(folderId, tenantId);
    if (!moving)
        throw new Error("NOT_FOUND");
    const siblings = await q.listFolders(tenantId, newParentId);
    if (siblings.some((s) => s.id !== folderId &&
        s.name.toLowerCase() === moving.name.toLowerCase())) {
        throw new Error("BAD_REQUEST: A folder with this name already exists in the destination");
    }
}
export async function createFolder(tenantId, input, ctx) {
    var _a, _b, _c, _d, _e, _f, _g;
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
    const path = (_a = input.path) !== null && _a !== void 0 ? _a : (parent ? `${parent.path}/${input.name}` : input.name);
    return q.upsertFolder(tenantId, {
        name: input.name,
        parentId: (_b = input.parentId) !== null && _b !== void 0 ? _b : null,
        description: (_c = input.description) !== null && _c !== void 0 ? _c : null,
        path,
        ownerId: (_d = input.ownerId) !== null && _d !== void 0 ? _d : ctx.userId,
        visibility: (_e = input.visibility) !== null && _e !== void 0 ? _e : roleDefaultVisibility(ctx.role),
        acl: ((_f = input.acl) !== null && _f !== void 0 ? _f : []),
        metadata: (_g = input.metadata) !== null && _g !== void 0 ? _g : {},
        createdBy: ctx.userId,
        updatedBy: ctx.userId,
    });
}
export async function updateFolder(folderId, tenantId, patch, ctx) {
    var _a;
    await assertTenantAccess(tenantId);
    const existing = await q.getFolder(folderId, tenantId);
    if (!existing)
        throw new Error("NOT_FOUND");
    const existingParent = existing.parentId
        ? await q.getFolder(existing.parentId, tenantId)
        : null;
    assertCanWriteFolder({
        folder: existing,
        parent: existingParent,
        context: ctx,
    });
    if (patch.parentId !== undefined && patch.parentId !== existing.parentId) {
        await assertValidFolderMove(folderId, (_a = patch.parentId) !== null && _a !== void 0 ? _a : null, tenantId);
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
    const mergedMetadata = patch.metadata !== undefined
        ? Object.assign(Object.assign({}, existing.metadata), patch.metadata) : existing.metadata;
    const patchWithoutMeta = Object.assign({}, patch);
    delete patchWithoutMeta.metadata;
    return q.upsertFolder(tenantId, Object.assign(Object.assign(Object.assign({}, existing), patchWithoutMeta), { metadata: mergedMetadata, id: folderId, updatedBy: ctx.userId }));
}
export async function deleteFolderById(folderId, tenantId, ctx) {
    await assertTenantAccess(tenantId);
    const existing = await q.getFolder(folderId, tenantId);
    if (!existing)
        throw new Error("NOT_FOUND");
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
export async function createShareLink(tenantId, input, ctx) {
    var _a, _b, _c, _d, _e, _f, _g;
    await assertTenantAccess(tenantId);
    if (input.fileId) {
        const file = await q.getFile(input.fileId, tenantId);
        if (!file)
            throw new Error("NOT_FOUND");
        const folder = file.folderId
            ? await q.getFolder(file.folderId, tenantId)
            : null;
        assertCanShare({ file, folder, context: ctx });
    }
    else if (input.folderId) {
        if (ctx.role !== "admin" && ctx.role !== "director") {
            throw new Error("FORBIDDEN");
        }
    }
    else {
        throw new Error("BAD_REQUEST: fileId or folderId required");
    }
    const expiresAt = input.expiresInSeconds && input.expiresInSeconds > 0
        ? new Date(Date.now() + input.expiresInSeconds * 1000).toISOString()
        : null;
    return q.upsertShareLink(tenantId, {
        fileId: (_a = input.fileId) !== null && _a !== void 0 ? _a : null,
        folderId: (_b = input.folderId) !== null && _b !== void 0 ? _b : null,
        token: shareToken(),
        status: "active",
        passwordHash: input.password ? hashPassword(input.password) : null,
        expiresAt,
        maxViews: (_c = input.maxViews) !== null && _c !== void 0 ? _c : null,
        viewCount: 0,
        allowDownload: (_d = input.allowDownload) !== null && _d !== void 0 ? _d : true,
        metadata: (_e = input.metadata) !== null && _e !== void 0 ? _e : {},
        createdBy: (_g = (_f = ctx.userId) !== null && _f !== void 0 ? _f : input.createdBy) !== null && _g !== void 0 ? _g : null,
    });
}
export async function patchShareLink(linkId, tenantId, patch, ctx) {
    var _a, _b, _c, _d;
    await assertTenantAccess(tenantId);
    const existing = await q.getShareLink(linkId, tenantId);
    if (!existing)
        throw new Error("NOT_FOUND");
    if (existing.fileId) {
        const file = await q.getFile(existing.fileId, tenantId);
        if (!file)
            throw new Error("NOT_FOUND");
        const folder = file.folderId
            ? await q.getFolder(file.folderId, tenantId)
            : null;
        assertCanShare({ file, folder, context: ctx });
    }
    else if (ctx.role !== "admin" && ctx.role !== "director") {
        throw new Error("FORBIDDEN");
    }
    return q.upsertShareLink(tenantId, {
        id: linkId,
        metadata: patch.metadata !== undefined
            ? Object.assign(Object.assign({}, existing.metadata), patch.metadata) : existing.metadata,
        allowDownload: (_a = patch.allowDownload) !== null && _a !== void 0 ? _a : existing.allowDownload,
        expiresAt: (_b = patch.expiresAt) !== null && _b !== void 0 ? _b : existing.expiresAt,
        maxViews: (_c = patch.maxViews) !== null && _c !== void 0 ? _c : existing.maxViews,
        status: (_d = patch.status) !== null && _d !== void 0 ? _d : existing.status,
    });
}
export async function regenerateShareLinkToken(linkId, tenantId, ctx) {
    await assertTenantAccess(tenantId);
    const existing = await q.getShareLink(linkId, tenantId);
    if (!existing)
        throw new Error("NOT_FOUND");
    if (existing.fileId) {
        const file = await q.getFile(existing.fileId, tenantId);
        if (!file)
            throw new Error("NOT_FOUND");
        const folder = file.folderId
            ? await q.getFolder(file.folderId, tenantId)
            : null;
        assertCanShare({ file, folder, context: ctx });
    }
    else if (existing.folderId) {
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
        metadata: Object.assign(Object.assign({}, existing.metadata), { lastRegeneratedAt: nowIso() }),
    });
}
export async function viewShareLink(token, opts = {}) {
    var _a, _b, _c;
    const link = await q.getShareLinkByToken(token);
    if (!link)
        throw new Error("NOT_FOUND");
    const evaluation = evaluateShareLink(link, opts);
    if (!evaluation.allowed) {
        throw new Error(`FORBIDDEN: ${(_a = evaluation.reason) !== null && _a !== void 0 ? _a : "Access denied"}`);
    }
    const tenantId = link.tenantId;
    let file = null;
    let folder = null;
    let signedUrl = null;
    if (link.fileId) {
        file = await q.getFile(link.fileId, tenantId);
        if (file) {
            folder = file.folderId ? await q.getFolder(file.folderId, tenantId) : null;
            if (!publicShareLinkAllowedForFileInFolder(file, folder)) {
                throw new Error("FORBIDDEN: Share link cannot bypass folder ACL");
            }
        }
        if (file === null || file === void 0 ? void 0 : file.storageKey) {
            const signed = await createSignedUrlCached(tenantId, file.storageKey, {
                bucket: (_b = file.storageBucket) !== null && _b !== void 0 ? _b : undefined,
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
    }
    else if (link.folderId) {
        folder = await q.getFolder(link.folderId, tenantId);
    }
    await q.incrementShareLinkViewCount(link.id, tenantId);
    const refreshed = (_c = (await q.getShareLink(link.id, tenantId))) !== null && _c !== void 0 ? _c : link;
    return { link: refreshed, file, folder, signedUrl };
}
export async function revokeShareLinkById(id, tenantId, ctx) {
    await assertTenantAccess(tenantId);
    if (ctx.role !== "admin" && ctx.role !== "director") {
        const link = await q.getShareLink(id, tenantId);
        if (!link || link.createdBy !== ctx.userId)
            throw new Error("FORBIDDEN");
    }
    await q.revokeShareLink(id, tenantId);
}
// -------- Signature Requests --------
export async function createSignatureRequest(tenantId, input, ctx) {
    var _a, _b;
    await assertTenantAccess(tenantId);
    const file = await q.getFile(input.fileId, tenantId);
    if (!file)
        throw new Error("NOT_FOUND");
    const folder = file.folderId
        ? await q.getFolder(file.folderId, tenantId)
        : null;
    assertCanSign({ file, folder, context: ctx });
    const seed = buildSignatureRequest({
        tenantId,
        input: Object.assign(Object.assign({}, input), { createdBy: (_b = (_a = ctx.userId) !== null && _a !== void 0 ? _a : input.createdBy) !== null && _b !== void 0 ? _b : null }),
    });
    const saved = await q.upsertSignatureRequest(tenantId, seed);
    await q.upsertFile(tenantId, Object.assign(Object.assign({}, file), { signatureStatus: saved.status }));
    return saved;
}
export async function getSignatureSurfaceByToken(token) {
    const request = await q.getSignatureRequestBySignerToken(token);
    if (!request)
        throw new Error("NOT_FOUND");
    if (request.status === "expired" || request.status === "completed") {
        // Still serve, but don't allow actions.
    }
    const file = await q.getFile(request.fileId, request.tenantId);
    if (!file)
        throw new Error("NOT_FOUND");
    const signer = findSignerByToken(request, token);
    return { request, file, signer };
}
export async function recordSignerView(token, ctx = {}) {
    const request = await q.getSignatureRequestBySignerToken(token);
    if (!request)
        throw new Error("NOT_FOUND");
    if (isExpired(request.expiresAt)) {
        const expired = expireRequest(request);
        return q.upsertSignatureRequest(request.tenantId, expired);
    }
    const updated = markSignerViewed(request, token, ctx);
    return q.upsertSignatureRequest(request.tenantId, updated);
}
export async function recordFieldFill(token, fieldId, value, ctx = {}) {
    const request = await q.getSignatureRequestBySignerToken(token);
    if (!request)
        throw new Error("NOT_FOUND");
    const updated = fillField(request, token, fieldId, value, ctx);
    return q.upsertSignatureRequest(request.tenantId, updated);
}
export async function recordSignerSignature(token, ctx = {}) {
    const request = await q.getSignatureRequestBySignerToken(token);
    if (!request)
        throw new Error("NOT_FOUND");
    const updated = markSignerSigned(request, token, ctx);
    const saved = await q.upsertSignatureRequest(request.tenantId, updated);
    if (saved.status === "completed") {
        // Update file signature status
        const file = await q.getFile(saved.fileId, saved.tenantId);
        if (file) {
            await q.upsertFile(saved.tenantId, Object.assign(Object.assign({}, file), { signatureStatus: saved.status }));
        }
    }
    return saved;
}
export async function recordSignerDecline(token, reason, ctx = {}) {
    const request = await q.getSignatureRequestBySignerToken(token);
    if (!request)
        throw new Error("NOT_FOUND");
    const updated = declineRequest(request, token, reason, ctx);
    return q.upsertSignatureRequest(request.tenantId, updated);
}
export async function getSignatureRequestDetail(requestId, tenantId, ctx) {
    await assertTenantAccess(tenantId);
    const request = await q.getSignatureRequest(requestId, tenantId);
    if (!request)
        throw new Error("NOT_FOUND");
    const file = await q.getFile(request.fileId, tenantId);
    if (!file)
        throw new Error("NOT_FOUND");
    const folder = file.folderId ? await q.getFolder(file.folderId, tenantId) : null;
    assertCanRead({ file, folder, context: ctx });
    return { request, file };
}
export async function restoreFileToVersion(fileId, versionId, tenantId, ctx) {
    await assertTenantAccess(tenantId);
    const file = await q.getFile(fileId, tenantId);
    if (!file)
        throw new Error("NOT_FOUND");
    const folder = file.folderId ? await q.getFolder(file.folderId, tenantId) : null;
    assertCanWrite({ file, folder, context: ctx });
    const version = await q.getFileVersion(versionId, tenantId);
    if (!version || version.fileId !== fileId)
        throw new Error("NOT_FOUND");
    return q.upsertFile(tenantId, Object.assign(Object.assign({}, file), { id: fileId, mimeType: version.mimeType, size: version.size, storageKey: version.storageKey, storageBucket: version.storageBucket, checksum: version.checksum, currentVersionId: version.id, metadata: Object.assign(Object.assign({}, file.metadata), { lastRestoredVersion: version.version, lastRestoredAt: nowIso() }), updatedBy: ctx.userId }));
}
export async function deleteStoredFileVersion(fileId, versionId, tenantId, ctx) {
    var _a;
    await assertTenantAccess(tenantId);
    const file = await q.getFile(fileId, tenantId);
    if (!file)
        throw new Error("NOT_FOUND");
    const folder = file.folderId ? await q.getFolder(file.folderId, tenantId) : null;
    assertCanWrite({ file, folder, context: ctx });
    const versions = await q.listVersions(fileId, tenantId);
    if (versions.length <= 1) {
        throw new Error("BAD_REQUEST: Cannot delete the only version");
    }
    const version = await q.getFileVersion(versionId, tenantId);
    if (!version || version.fileId !== fileId)
        throw new Error("NOT_FOUND");
    if (file.currentVersionId === versionId) {
        throw new Error("BAD_REQUEST: Restore a different version before deleting the current revision");
    }
    if (version.storageKey) {
        await deleteBlob(tenantId, version.storageKey, (_a = version.storageBucket) !== null && _a !== void 0 ? _a : undefined);
    }
    await q.deleteFileVersionRecord(versionId, tenantId);
}
export async function buildAllVersionsZip(fileId, tenantId, ctx) {
    var _a;
    await assertTenantAccess(tenantId);
    const file = await q.getFile(fileId, tenantId);
    if (!file)
        throw new Error("NOT_FOUND");
    const folder = file.folderId
        ? await q.getFolder(file.folderId, tenantId)
        : null;
    assertCanRead({ file, folder, context: ctx });
    const versions = await q.listVersions(fileId, tenantId);
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    const base = file.name.replace(/[^\w.\-]+/g, "_") || "file";
    for (const v of versions) {
        const bytes = await readBlob(tenantId, v.storageKey, (_a = v.storageBucket) !== null && _a !== void 0 ? _a : undefined);
        if (!bytes)
            continue;
        zip.file(`${base}_v${v.version}`, bytes);
    }
    const out = await zip.generateAsync({ type: "uint8array" });
    return out;
}
export async function bulkDeleteFiles(fileIds, tenantId, ctx) {
    await Promise.all(fileIds.map((id) => deleteFileById(id, tenantId, ctx)));
}
export async function bulkMoveFiles(fileIds, folderId, tenantId, ctx) {
    await Promise.all(fileIds.map((id) => updateFile(id, tenantId, { folderId }, ctx)));
}
export async function sendSignatureReminder(requestId, signerId, tenantId, ctx) {
    var _a;
    await assertTenantAccess(tenantId);
    const req = await q.getSignatureRequest(requestId, tenantId);
    if (!req)
        throw new Error("NOT_FOUND");
    const file = await q.getFile(req.fileId, tenantId);
    if (!file)
        throw new Error("NOT_FOUND");
    const folder = file.folderId
        ? await q.getFolder(file.folderId, tenantId)
        : null;
    assertCanSign({ file, folder, context: ctx });
    const signer = req.signers.find((s) => s.id === signerId);
    if (!signer)
        throw new Error("NOT_FOUND");
    const next = appendSignerReminder(req, signerId, {
        actor: (_a = ctx.userId) !== null && _a !== void 0 ? _a : undefined,
    });
    return q.upsertSignatureRequest(tenantId, next);
}
export async function signedUrlForFileVersion(fileId, versionId, tenantId, ctx, opts) {
    var _a;
    await assertTenantAccess(tenantId);
    const file = await q.getFile(fileId, tenantId);
    if (!file)
        throw new Error("NOT_FOUND");
    const folder = file.folderId ? await q.getFolder(file.folderId, tenantId) : null;
    assertCanRead({ file, folder, context: ctx });
    const version = await q.getFileVersion(versionId, tenantId);
    if (!version || version.fileId !== fileId)
        throw new Error("NOT_FOUND");
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
        ttlSeconds: opts === null || opts === void 0 ? void 0 : opts.ttlSeconds,
        bucket: (_a = version.storageBucket) !== null && _a !== void 0 ? _a : undefined,
        download: opts === null || opts === void 0 ? void 0 : opts.download,
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
export async function deleteFileAndStorage(fileId, tenantId, ctx) {
    var _a;
    await assertTenantAccess(tenantId);
    const file = await q.getFile(fileId, tenantId);
    if (!file)
        return;
    const folder = file.folderId
        ? await q.getFolder(file.folderId, tenantId)
        : null;
    assertCanWrite({ file, folder, context: ctx });
    if (file.storageKey) {
        await deleteBlob(tenantId, file.storageKey, (_a = file.storageBucket) !== null && _a !== void 0 ? _a : undefined);
    }
    await q.deleteFile(fileId, tenantId);
}
