"use client";

import { memo } from "react";
import { Handle, Position } from "reactflow";
import clsx from "clsx";

interface AgentNodeData {
  name: string;
  role: string;
  color: string;
  status: string;
  onClick: () => void;
}

function AgentNode({ data }: { data: AgentNodeData }) {
  const isActive = data.status === "build_now" || data.status === "deployed";

  return (
    <div
      onClick={data.onClick}
      className="cursor-pointer group"
    >
      <div
        className={clsx(
          "relative px-5 py-3 rounded-xl border backdrop-blur-sm transition-all duration-200",
          "hover:scale-105 hover:shadow-lg",
          "bg-[#111]/80 border-[#222]",
          "group-hover:border-opacity-60"
        )}
        style={{
          borderColor: `${data.color}33`,
          boxShadow: isActive ? `0 0 20px ${data.color}15` : undefined,
        }}
      >
        {/* Status dot */}
        <div className="flex items-center gap-2 mb-1">
          <div
            className={clsx("w-2 h-2 rounded-full", isActive && "status-pulse")}
            style={{ backgroundColor: data.color }}
          />
          <span
            className="text-xs font-bold tracking-widest uppercase"
            style={{ color: data.color }}
          >
            {data.name}
          </span>
        </div>
        <div className="text-[11px] text-[#777]">{data.role}</div>
        <div className="text-[10px] text-[#444] mt-1 capitalize">
          {data.status.replace("_", " ")}
        </div>
      </div>
      <Handle type="target" position={Position.Top} className="!bg-[#333] !border-none !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-[#333] !border-none !w-2 !h-2" />
    </div>
  );
}

export default memo(AgentNode);
