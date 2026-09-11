"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

import { SUPPORT_USER_ID } from "@/lib/seed/ids";
import type { Role, SessionSelection } from "@/lib/types";

type SessionStoreValue = SessionSelection & {
  setRole: (role: Role | null) => void;
  setPersonaId: (personaId: string | null) => void;
  setTicketId: (ticketId: string | null) => void;
  supportPersonaId: string;
};

const SessionStoreContext = createContext<SessionStoreValue | null>(null);

const initialSelection: SessionSelection = {
  role: null,
  personaId: null,
  ticketId: null,
};

export function SessionProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<SessionSelection>(initialSelection);

  function setRole(role: Role | null) {
    setSelection({
      role,
      personaId: role === "support" ? SUPPORT_USER_ID : null,
      ticketId: null,
    });
  }

  function setPersonaId(personaId: string | null) {
    setSelection((current) => {
      if (current.role === "support") {
        return current;
      }

      return {
        ...current,
        personaId,
        ticketId: null,
      };
    });
  }

  function setTicketId(ticketId: string | null) {
    setSelection((current) => {
      if (current.role !== "support") {
        return current;
      }

      return {
        ...current,
        ticketId,
      };
    });
  }

  return (
    <SessionStoreContext.Provider
      value={{
        ...selection,
        setRole,
        setPersonaId,
        setTicketId,
        supportPersonaId: SUPPORT_USER_ID,
      }}
    >
      {children}
    </SessionStoreContext.Provider>
  );
}

export function useSessionStore() {
  const context = useContext(SessionStoreContext);

  if (!context) {
    throw new Error("useSessionStore must be used within a SessionProvider");
  }

  return context;
}

export { SUPPORT_USER_ID as SUPPORT_PERSONA_ID };
