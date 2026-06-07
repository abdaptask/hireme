"use client";

import { createContext, useContext, useState } from "react";
import { CopilotPanel } from "@/components/ai/copilot-panel";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

type AiContextValue = {
  isOpen: boolean;
  openCopilot: (initialPrompt?: string) => void;
  closeCopilot: () => void;
  initialPrompt: string;
};

const AiContext = createContext<AiContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AiProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState("");

  function openCopilot(prompt: string = "") {
    setInitialPrompt(prompt);
    setIsOpen(true);
  }

  function closeCopilot() {
    setIsOpen(false);
  }

  return (
    <AiContext.Provider value={{ isOpen, openCopilot, closeCopilot, initialPrompt }}>
      {children}
      <CopilotPanel
        isOpen={isOpen}
        onClose={closeCopilot}
        initialPrompt={initialPrompt}
      />
    </AiContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAiCopilot(): AiContextValue {
  const ctx = useContext(AiContext);
  if (!ctx) {
    throw new Error("useAiCopilot must be used within an AiProvider");
  }
  return ctx;
}
