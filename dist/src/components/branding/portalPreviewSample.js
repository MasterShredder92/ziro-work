/** Hardcoded portal dashboard sample — not tenant data. */
export const PORTAL_PREVIEW_SAMPLE = {
    portalLabel: "Family portal",
    nav: ["Dashboard", "Calendar", "Students", "Billing", "Messages"],
    upcomingLesson: {
        title: "Piano · Technique & repertoire",
        when: "Tuesday, Apr 22 · 4:00 PM",
        duration: "30 min",
    },
    teacher: {
        name: "Alex Kim",
        title: "Piano faculty",
    },
    location: {
        name: "Bellevue",
        detail: "Studio 3 · 1420 Oak Ave",
    },
    nextSteps: [
        { id: "1", text: "Sign spring policy acknowledgment" },
        { id: "2", text: "Add a backup contact for pickups" },
        { id: "3", text: "Reserve a slot for summer intensive" },
    ],
    family: {
        primary: "Taylor Morgan",
        students: [
            { name: "Jordan Lee", role: "Student" },
            { name: "Sam Lee", role: "Student" },
        ],
    },
    teacherPortalNote: "Teacher view shows roster & lesson notes.",
    studentPortalNote: "Student view emphasizes practice goals.",
};
