import React, { createContext, useContext, useMemo, useState } from "react";

type AgentContextValue = {
  agentId: string;
  setAgentId: React.Dispatch<React.SetStateAction<string>>;
};

const AgentContext = createContext<AgentContextValue | null>(null);

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [agentId, setAgentId] = useState<string>("ziro");

  const value = useMemo(() => ({ agentId, setAgentId }), [agentId]);

  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>;
}

export function useAgentContext(): AgentContextValue {
  const ctx = useContext(AgentContext);
  if (!ctx) {
    throw new Error("useAgentContext must be used within <AgentProvider>.");
  }
  return ctx;
}

