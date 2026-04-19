"use client";

import * as React from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { cn } from "@/components/ui/utils/cn";

export type SettingsSectionProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function SettingsSection({ title, description, children, className }: SettingsSectionProps) {
  return (
    <div className={cn("space-y-[var(--z-space-5)]", className)}>
      <PageHeader title={title} subtitle={description} />
      <Section spacing="tight">{children}</Section>
    </div>
  );
}
