"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import AgentChart from "@/components/AgentChart";
import ChatSidebar from "@/components/ChatSidebar";

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

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("agents")
      .select("id, slug, name, role, status, color, position_x, position_y")
      .order("position_x", { ascending: true })
      .then(({ data }) => {
        setAgents(data || []);
        setLoading(false);
      });
  }, []);

  const handleAgentClick = useCallback((agent: Agent) => {
    setSelectedAgent(agent);
  }, []);

  const handleCloseChat = useCallback(() => {
    setSelectedAgent(null);
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#080808]">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">
            <span className="text-[#00ff88]">ZIRO</span>
            <span className="text-white ml-1">WORK</span>
          </h1>
          <div className="text-[#555] text-sm">Loading command center...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar />

      {/* Main canvas */}
      <main
        className="flex-1 h-full transition-all duration-300"
        style={{
          marginLeft: 220,
          marginRight: selectedAgent ? 400 : 0,
        }}
      >
        <AgentChart agents={agents} onAgentClick={handleAgentClick} />
      </main>

      {/* Chat sidebar */}
      <ChatSidebar agent={selectedAgent} onClose={handleCloseChat} />
    </div>
  );
}
