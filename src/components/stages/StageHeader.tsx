"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/components/ui/utils";

export type StageHeaderProps = {
  stageName: string;
  description: string;
  className?: string;
};

export function StageHeader({ stageName, description, className }: StageHeaderProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <PageHeader
        title={stageName}
        subtitle={description}
      />
    </div>
  );
}
