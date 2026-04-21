// Files & Documents OS — shared types.
export const FILE_VISIBILITIES = ["private", "tenant", "shared", "public"];
export const FILE_STATUSES = ["active", "archived", "deleted"];
export const SHARE_LINK_STATUSES = ["active", "revoked", "expired"];
export const SIGNATURE_STATUSES = [
    "pending",
    "viewed",
    "signed",
    "completed",
    "declined",
    "expired",
];
export const SIGNATURE_FIELD_TYPES = [
    "text",
    "checkbox",
    "date",
    "signature-draw",
    "initials",
];
export const FILE_ACL_SCOPES = ["read", "write", "share"];
