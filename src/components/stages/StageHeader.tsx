"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/components/ui/utils";

export type StageHeaderProps = {
  stageName: string;
  description: string;
  agentName: string;
  className?: string;
};

export function StageHeader({ stageName, description, agentName, className }: StageHeaderProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <PageHeader
        title={stageName}
        subtitle={description}
        actions={
          <Badge variant="success" active>
            {agentName}
          </Badge>
        }
      />
    </div>
  );
}
