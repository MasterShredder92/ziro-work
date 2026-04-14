"use client";

import { memo } from "react";
import { Handle, Position } from "reactflow";
import clsx from "clsx";

interface AgentNodeData {
  name: string;
  role: string;
  color: string;
  status: string;
  mode: string;
  isOrchestrator: boolean;
  onClick: () => void;
}

function AgentNode({ data }: { data: AgentNodeData }) {
  const isActive =
    data.status === "deployed" ||
    data.status === "active" ||
    data.status === "running" ||
    data.status === "build_now";

  return (
    <div onClick={data.onClick} className="cursor-pointer group">
      <div
        className={clsx(
          "relative rounded-xl border backdrop-blur-sm transition-all duration-200",
          "hover:scale-105 hover:shadow-lg",
          "bg-[#101012]/80 border-[#232326]",
          "group-hover:border-opacity-60",
          data.isOrchestrator ? "px-8 py-5" : "px-6 py-4"
        )}
        style={{
          borderColor: `${data.color}33`,
          boxShadow: isActive ? `0 0 24px ${data.color}20` : undefined,
        }}
      >
        {/* Status dot + name */}
        <div className="flex items-center gap-2 mb-1">
          <div
            className={clsx(
              "rounded-full",
              isActive && "status-pulse",
              data.isOrchestrator ? "w-3 h-3" : "w-2.5 h-2.5"
            )}
            style={{ backgroundColor: data.color }}
          />
          <span
            className={clsx(
              "font-bold tracking-widest uppercase",
              data.isOrchestrator ? "text-[15px]" : "text-sm"
            )}
            style={{ color: data.color }}
          >
            {data.name}
          </span>
        </div>

        <div className="text-xs text-[#777]">{data.role}</div>

        {/* Status + mode badge */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-[#505055] capitalize">
            {data.status.replace("_", " ")}
          </span>
          {!data.isOrchestrator && (
            <span
              className="text-[11px] px-1.5 py-0.5 rounded-full"
              style={{
                color: data.mode === "ephemeral" ? "#f59e0b" : "#3b82f6",
                backgroundColor:
                  data.mode === "ephemeral" ? "#f59e0b15" : "#3b82f615",
              }}
            >
              {data.mode}
            </span>
          )}
        </div>
      </div>
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-[#3a3a3e] !border-none !w-2 !h-2"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-[#3a3a3e] !border-none !w-2 !h-2"
      />
    </div>
  );
}

export default memo(AgentNode);
