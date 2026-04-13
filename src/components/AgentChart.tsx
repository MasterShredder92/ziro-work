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
  position_x: number;
  position_y: number;
}

interface AgentChartProps {
  agents: Agent[];
  onAgentClick: (agent: Agent) => void;
}

export default function AgentChart({ agents, onAgentClick }: AgentChartProps) {

  const star = agents.find((a) => a.slug === "star");
  const others = agents.filter((a) => a.slug !== "star");

  const nodes: Node[] = useMemo(() => {
    const result: Node[] = [];

    if (star) {
      result.push({
        id: star.id,
        type: "agent",
        position: { x: 400, y: 30 },
        data: {
          name: star.name,
          role: star.role,
          color: star.color,
          status: star.status,
          onClick: () => onAgentClick(star),
        },
      });
    }

    const spacing = 140;
    const totalWidth = (others.length - 1) * spacing;
    const startX = 400 - totalWidth / 2;

    others.forEach((agent, i) => {
      result.push({
        id: agent.id,
        type: "agent",
        position: { x: startX + i * spacing, y: 180 },
        data: {
          name: agent.name,
          role: agent.role,
          color: agent.color,
          status: agent.status,
          onClick: () => onAgentClick(agent),
        },
      });
    });

    return result;
  }, [agents, star, others, onAgentClick]);

  const edges: Edge[] = useMemo(() => {
    if (!star) return [];
    return others.map((agent) => ({
      id: `${star.id}-${agent.id}`,
      source: star.id,
      target: agent.id,
      animated: agent.status === "build_now" || agent.status === "deployed",
      style: { stroke: "#333", strokeWidth: 1.5 },
    }));
  }, [star, others]);

  const onInit = useCallback((instance: { fitView: () => void }) => {
    setTimeout(() => instance.fitView(), 100);
  }, []);

  return (
    <ReactFlowProvider>
      <div className="w-full h-full">
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
      </div>
    </ReactFlowProvider>
  );
}
