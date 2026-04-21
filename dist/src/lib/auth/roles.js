export const roles = ["admin", "director", "teacher", "family", "student"];
export const roleHierarchy = {
    admin: 5,
    director: 4,
    teacher: 3,
    family: 2,
    student: 1,
};
export function isRole(value) {
    return typeof value === "string" && roles.includes(value);
}
export function compareRoles(a, b) {
    return roleHierarchy[a] - roleHierarchy[b];
}
export function roleAtLeast(actual, required) {
    return roleHierarchy[actual] >= roleHierarchy[required];
}
export function normalizeDbRole(value) {
    if (!value)
        return null;
    switch (value) {
        case "owner":
        case "admin":
            return "admin";
        case "company_director":
        case "studio_director":
        case "director":
            return "director";
        case "teacher":
            return "teacher";
        case "parent":
        case "family":
            return "family";
        case "student":
            return "student";
        default:
            return null;
    }
}
