"use client";

import { useCallback, useMemo } from "react";
import ReactFlow, {
  Background,
  Node,
  Edge,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import AgentNode from "./AgentNode";

const nodeTypes = { agent: AgentNode };

interface Agent {
  id: string;
  slug: string;
  name: string;
  role: string;
  status: string;
  color: string;
  mode: string | null;
  position_x: number;
  position_y: number;
}

interface AgentChartProps {
  agents: Agent[];
  onAgentClick: (agent: Agent) => void;
}

export default function AgentChart({ agents, onAgentClick }: AgentChartProps) {
  const star = agents.find((a) => a.slug === "star");
  const spawned = agents.filter((a) => a.slug !== "star");

  const nodes: Node[] = useMemo(() => {
    const result: Node[] = [];

    // STAR — always centered at top
    if (star) {
      result.push({
        id: star.id,
        type: "agent",
        position: { x: 400, y: 40 },
        data: {
          name: star.name,
          role: "Orchestrator",
          color: star.color,
          status: star.status,
          mode: "persistent",
          isOrchestrator: true,
          onClick: () => onAgentClick(star),
        },
      });
    }

    // Spawned agents — spread below STAR
    if (spawned.length > 0) {
      const spacing = 180;
      const totalWidth = (spawned.length - 1) * spacing;
      const startX = 400 - totalWidth / 2;

      spawned.forEach((agent, i) => {
        result.push({
          id: agent.id,
          type: "agent",
          position: { x: startX + i * spacing, y: 220 },
          data: {
            name: agent.name,
            role: agent.role,
            color: agent.color,
            status: agent.status,
            mode: agent.mode || "ephemeral",
            isOrchestrator: false,
            onClick: () => onAgentClick(agent),
          },
        });
      });
    }

    return result;
  }, [agents, star, spawned, onAgentClick]);

  const edges: Edge[] = useMemo(() => {
    if (!star) return [];
    return spawned.map((agent) => ({
      id: `${star.id}-${agent.id}`,
      source: star.id,
      target: agent.id,
      animated: agent.status === "active" || agent.status === "running",
      style: {
        stroke: agent.status === "active" || agent.status === "running"
          ? agent.color
          : "#333",
        strokeWidth: 1.5,
      },
    }));
  }, [star, spawned]);

  const onInit = useCallback((instance: { fitView: () => void }) => {
    setTimeout(() => instance.fitView(), 100);
  }, []);

  return (
    <ReactFlowProvider>
      <div className="w-full h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onInit={onInit}
          fitView
          proOptions={{ hideAttribution: true }}
          panOnDrag
          zoomOnScroll
          minZoom={0.5}
          maxZoom={1.5}
        >
          <Background color="#1a1a1a" gap={40} size={1} />
        </ReactFlow>

        {/* Empty state hint when only STAR is on canvas */}
        {spawned.length === 0 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center pointer-events-none">
            <p className="text-[#444] text-xs">
              STAR will spawn agents here when tasks are running
            </p>
          </div>
        )}
      </div>
    </ReactFlowProvider>
  );
}
