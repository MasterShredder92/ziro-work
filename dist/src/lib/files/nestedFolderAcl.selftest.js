var _a, _b;
/**
 * Manual regression check for nested folder ACL inheritance.
 * Run: `npx ts-node --project tsconfig.json -r tsconfig-paths/register src/lib/files/nestedFolderAcl.selftest.ts`
 * (or compile and run with node)
 */
import assert from "assert";
import { computeFilePermissions } from "./permissionsEngine";
const ctx = {
    role: "teacher",
    userId: "user-1",
    profileId: "user-1",
    tenantId: "t1",
};
const parentFolder = {
    id: "fold-parent",
    tenantId: "t1",
    parentId: null,
    name: "Parent",
    description: null,
    path: "Parent",
    ownerId: null,
    visibility: "tenant",
    acl: [
        {
            principalType: "user",
            principalId: "user-1",
            scopes: ["read", "write"],
        },
    ],
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: null,
    updatedBy: null,
};
const fileInFolder = {
    id: "file-1",
    tenantId: "t1",
    folderId: "fold-parent",
    ownerId: "someone-else",
    name: "doc.pdf",
    description: null,
    mimeType: "application/pdf",
    size: 100,
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: null,
    updatedBy: null,
};
const perms = computeFilePermissions({
    file: fileInFolder,
    folder: parentFolder,
    context: ctx,
});
assert.strictEqual(perms.canRead, true, "folder ACL should grant read");
assert.strictEqual(perms.canWrite, true, "folder ACL should grant write for teacher");
assert.strictEqual((_b = (_a = perms.hints) === null || _a === void 0 ? void 0 : _a.write) !== null && _b !== void 0 ? _b : null, null);
console.log("nestedFolderAcl.selftest: OK");
