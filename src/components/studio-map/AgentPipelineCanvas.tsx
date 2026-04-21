"use client";

import * as React from "react";
import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type NodeTypes,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AgentPipelineNode } from "./StudioMapNodes";
import { AGENT_DEFINITIONS } from "@/lib/agents/agentDefinitions";

const NODE_TYPES = {
  agent: AgentPipelineNode,
} satisfies NodeTypes;

const AGENT_ORDER = ["ziro", "star", "ruby", "sid", "vader", "stewie", "bub", "raven"];

export function AgentPipelineCanvas() {
  const initialNodes: Node[] = AGENT_ORDER.map((id, index) => {
    const def = AGENT_DEFINITIONS[id];
    const isZiro = id === "ziro";
    
    // Layout logic: Ziro in center-top, others in a flow
    let x = 0;
    let y = 0;

    if (isZiro) {
      x = 400;
      y = 50;
    } else {
      // Flow from left to right for the others
      x = (index - 1) * 250;
      y = 350;
    }

    return {
      id,
      type: "agent",
      position: { x, y },
      data: {
        agentId: id,
        name: def.name,
        role: def.role,
        accent: def.accent,
        glow: def.glow,
        image: `/static/agents/${id}.png`,
        isDirector: isZiro,
        status: "Live",
      },
    };
  });

  const initialEdges: Edge[] = [
    // Ziro connects to everyone
    ...AGENT_ORDER.slice(1).map((id) => ({
      id: `ziro-${id}`,
      source: "ziro",
      target: id,
      animated: true,
      style: { stroke: "#00ff88", strokeWidth: 2, opacity: 0.4 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#00ff88" },
    })),
    // Sequential flow
    ...AGENT_ORDER.slice(1, -1).map((id, i) => ({
      id: `flow-${id}-${AGENT_ORDER[i + 2]}`,
      source: id,
      target: AGENT_ORDER[i + 2],
      animated: true,
      style: { stroke: "#ffffff", strokeWidth: 1, opacity: 0.2 },
    })),
  ];

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="h-full w-full bg-[#050508] rounded-3xl overflow-hidden border border-white/5">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={NODE_TYPES}
          fitView
          minZoom={0.2}
          maxZoom={1.5}
          colorMode="dark"
        >
          <Background color="#111" gap={20} />
          <Controls showInteractive={false} className="!bg-[#0a0a0f] !border-white/10" />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
