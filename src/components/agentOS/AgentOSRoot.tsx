"use client";

import * as React from "react";
import { AgentOSProvider } from "./AgentOSContext";
import { AgentAvatarButton } from "./AgentAvatarButton";
import { AgentBubble } from "./AgentBubble";
import { AgentPointer } from "./AgentPointer";
import { AgentFullChat } from "./AgentFullChat";
import { AgentAutoCollapseOnScroll } from "./AgentAutoCollapseOnScroll";
import { AgentUIBoundary } from "./AgentUIBoundary";
import { AgentInlineSuggestions } from "./AgentInlineSuggestions";
// AgentEventLogDrawer and AgentExperienceDock removed — floating dock was covering UI
import { AgentDomainActionBridge } from "./AgentDomainActionBridge";

/**
 * Mount-once root for the AgentOS UI.
 * Wraps children in the AgentOSProvider and renders the floating surfaces.
 */
export function AgentOSRoot({ children }: { children: React.ReactNode }) {
  return (
    <AgentOSProvider>
      {children}
      <AgentUIBoundary>
        <AgentAvatarButton />
        <AgentBubble />
        <AgentPointer />
        <AgentFullChat />
        <AgentAutoCollapseOnScroll />
        <AgentInlineSuggestions />
        <AgentDomainActionBridge />
      </AgentUIBoundary>
    </AgentOSProvider>
  );
}
