export type CommandNav = {
  id: string;
  label: string;
  kind: "nav";
  href: string;
  haystack: string;
};

export type CommandAction = {
  id: string;
  label: string;
  kind: "action";
  actionId: "newFamily" | "newStudent" | "newInvoice" | "familyAddStudent";
  haystack: string;
};

export type CommandDef = CommandNav | CommandAction;
