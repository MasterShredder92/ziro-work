/**
 * Supplemental checks (dev). Core invariants also run in `permissionsEngine` on import in non-production.
 */
import assert from "node:assert/strict";
import { computeFilePermissions, computeFolderAccessPermissions, evaluateShareLink, hashPassword, publicShareLinkAllowedForFileInFolder, } from "./permissionsEngine";
const baseCtx = (role) => ({
    role,
    userId: "u1",
    profileId: "u1",
    tenantId: "t1",
});
function sampleFile(over = {}) {
    return Object.assign({ id: "f1", tenantId: "t1", folderId: "fold1", ownerId: "other", name: "doc.pdf", description: null, mimeType: "application/pdf", size: 100, extension: "pdf", storageKey: "k", storageBucket: "files", checksum: null, visibility: "private", status: "active", currentVersionId: null, thumbnailKey: null, virusScanStatus: "skipped", signatureStatus: null, tags: [], acl: [
            {
                principalType: "user",
                principalId: "u1",
                scopes: ["read"],
            },
        ], metadata: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: null, updatedBy: null }, over);
}
function sampleFolder(over = {}) {
    return Object.assign({ id: "fold1", tenantId: "t1", parentId: "parent1", name: "Contracts", description: null, path: "Contracts", ownerId: "other", visibility: "tenant", acl: [
            {
                principalType: "user",
                principalId: "u1",
                scopes: ["write"],
            },
        ], metadata: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: null, updatedBy: null }, over);
}
/** Unit-level checks for ACL inheritance, share-link overrides, and folder rules. */
export function runPermissionsEngineSelfTest() {
    const teacher = baseCtx("teacher");
    const f = sampleFile();
    const folder = sampleFolder();
    const parent = sampleFolder({
        id: "parent1",
        parentId: null,
        name: "Root",
        path: "Root",
        acl: [],
    });
    const aclRead = computeFilePermissions({ file: f, folder, context: teacher });
    assert.equal(aclRead.canRead, true, "ACL read on file");
    const folderWrite = computeFolderAccessPermissions({
        folder,
        parent,
        context: teacher,
    });
    assert.equal(folderWrite.canWrite, true, "Folder ACL write");
    const link = {
        id: "l1",
        tenantId: "t1",
        fileId: "f1",
        folderId: null,
        token: "tok",
        status: "active",
        passwordHash: hashPassword("secret"),
        expiresAt: new Date(Date.now() + 60000).toISOString(),
        maxViews: 10,
        viewCount: 0,
        allowDownload: true,
        createdBy: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {},
    };
    const ev = evaluateShareLink(link, { password: "secret" });
    assert.equal(ev.allowed, true, "Share link password matches");
    const evBad = evaluateShareLink(link, { password: "wrong" });
    assert.equal(evBad.allowed, false, "Share link wrong password");
    const expired = Object.assign(Object.assign({}, link), { expiresAt: new Date(Date.now() - 60000).toISOString() });
    const evExp = evaluateShareLink(expired, {});
    assert.equal(evExp.allowed, false, "Share link expired");
    const aclFolder = sampleFolder({
        acl: [{ principalType: "user", principalId: "u2", scopes: ["read"] }],
    });
    const privateNoAcl = sampleFile({ visibility: "private", acl: [] });
    assert.equal(publicShareLinkAllowedForFileInFolder(privateNoAcl, aclFolder), false, "Private file without ACL cannot bypass restricted folder via share link");
    const privateWithAcl = sampleFile({
        visibility: "private",
        acl: [{ principalType: "user", principalId: "u9", scopes: ["read"] }],
    });
    assert.equal(publicShareLinkAllowedForFileInFolder(privateWithAcl, aclFolder), true, "Private file with ACL entry allowed when folder ACL is non-empty");
    assert.equal(publicShareLinkAllowedForFileInFolder(privateNoAcl, null), true, "Root-level file not blocked by folder rule");
    const tenantFile = sampleFile({ visibility: "tenant", acl: [] });
    assert.equal(publicShareLinkAllowedForFileInFolder(tenantFile, aclFolder), true, "Tenant-visible file may use link under ACL folder");
}
