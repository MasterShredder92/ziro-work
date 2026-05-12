import type { CommandDef } from "@/components/command/commandPaletteTypes";

export const BASE_COMMANDS: CommandDef[] = [
  {
    id: "nav-dashboard",
    label: "Go to Dashboard",
    kind: "nav",
    href: "/dashboard",
    haystack: "dashboard home overview",
  },
  {
    id: "nav-studio-map",
    label: "Go to Studio Map",
    kind: "nav",
    href: "/studio-map",
    haystack: "studio map locations rooms",
  },
  {
    id: "act-family",
    label: "New Family",
    kind: "action",
    actionId: "newFamily",
    haystack: "new family account household",
  },
  {
    id: "act-student",
    label: "New Student",
    kind: "action",
    actionId: "newStudent",
    haystack: "new student learner enroll",
  },
  {
    id: "act-invoice",
    label: "New Invoice",
    kind: "action",
    actionId: "newInvoice",
    haystack: "new invoice billing charge",
  },
  {
    id: "nav-leads",
    label: "Review Leads",
    kind: "nav",
    href: "/lifecycle/lead-work",
    haystack: "leads pipeline intake prospects",
  },
  {
    id: "nav-at-risk",
    label: "See At-Risk Students",
    kind: "nav",
    href: "/lifecycle/retention",
    haystack: "at risk retention churn students",
  },
];
