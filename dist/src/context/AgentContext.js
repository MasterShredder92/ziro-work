import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useMemo, useState } from "react";
const AgentContext = createContext(null);
export function AgentProvider({ children }) {
    const [agentId, setAgentId] = useState("ziro");
    const value = useMemo(() => ({ agentId, setAgentId }), [agentId]);
    return _jsx(AgentContext.Provider, { value: value, children: children });
}
export function useAgentContext() {
    const ctx = useContext(AgentContext);
    if (!ctx) {
        throw new Error("useAgentContext must be used within <AgentProvider>.");
    }
    return ctx;
}
