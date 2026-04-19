export type EmailTemplateCategory =
  | "Onboarding"
  | "Lifecycle"
  | "Billing"
  | "Win-back"
  | "Marketing";

export type EmailTemplateModel = {
  id: string;
  title: string;
  description: string;
  category: EmailTemplateCategory;
  body: string;
};
