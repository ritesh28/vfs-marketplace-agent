"use client";

import { useEffect, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSessionStore } from "@/lib/session-store";
import { ROLES, type Persona, type Role, type TicketSummary } from "@/lib/types";

export function PersonaPicker() {
  const {
    role,
    personaId,
    ticketId,
    setRole,
    setPersonaId,
    setTicketId,
  } = useSessionStore();

  const [personas, setPersonas] = useState<Persona[]>([]);
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [loadingPersonas, setLoadingPersonas] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!role) {
      setPersonas([]);
      return;
    }

    let cancelled = false;

    async function loadPersonas() {
      setLoadingPersonas(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/personas?role=${encodeURIComponent(role!)}`,
        );
        const data = (await response.json()) as Persona[] | { error?: string };

        if (!response.ok) {
          throw new Error(
            !Array.isArray(data) && data.error
              ? data.error
              : "Failed to load personas",
          );
        }

        if (!cancelled) {
          const next = Array.isArray(data) ? data : [];
          setPersonas(next);

          // Support has a single DB persona — auto-select from API, not seed IDs.
          if (role === "SUPPORT" && next[0]) {
            setPersonaId(next[0].id);
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setPersonas([]);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load personas",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingPersonas(false);
        }
      }
    }

    void loadPersonas();

    return () => {
      cancelled = true;
    };
    // setPersonaId is stable enough for this effect; role is the real trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  useEffect(() => {
    if (role !== "SUPPORT") {
      setTickets([]);
      return;
    }

    let cancelled = false;

    async function loadTickets() {
      setLoadingTickets(true);
      setError(null);

      try {
        const response = await fetch("/api/tickets");
        const data = (await response.json()) as
          | TicketSummary[]
          | { error?: string };

        if (!response.ok) {
          throw new Error(
            !Array.isArray(data) && data.error
              ? data.error
              : "Failed to load tickets",
          );
        }

        if (!cancelled) {
          setTickets(Array.isArray(data) ? data : []);
        }
      } catch (loadError) {
        if (!cancelled) {
          setTickets([]);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load tickets",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingTickets(false);
        }
      }
    }

    void loadTickets();

    return () => {
      cancelled = true;
    };
  }, [role]);

  const supportPersona = personas[0];

  return (
    <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2">
      <Select
        value={role ?? undefined}
        onValueChange={(value) => setRole(value as Role)}
      >
        <SelectTrigger size="sm" className="w-[140px]" aria-label="Role">
          <SelectValue placeholder="Select role" />
        </SelectTrigger>
        <SelectContent>
          {ROLES.map((id) => (
            <SelectItem key={id} value={id}>
              {id.charAt(0) + id.slice(1).toLowerCase()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {role === "SUPPORT" ? (
        <>
          <Select value={personaId ?? supportPersona?.id} disabled>
            <SelectTrigger
              size="sm"
              className="w-[180px]"
              aria-label="Support persona"
            >
              <SelectValue
                placeholder={loadingPersonas ? "Loading…" : "Support"}
              />
            </SelectTrigger>
            <SelectContent>
              {supportPersona ? (
                <SelectItem value={supportPersona.id}>
                  {supportPersona.name}
                </SelectItem>
              ) : null}
            </SelectContent>
          </Select>
          <Select
            value={ticketId ?? undefined}
            onValueChange={(value) => setTicketId(value)}
            disabled={loadingTickets || tickets.length === 0}
          >
            <SelectTrigger size="sm" className="w-[280px]" aria-label="Ticket">
              <SelectValue
                placeholder={
                  loadingTickets ? "Loading tickets…" : "Select ticket"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {tickets.map((ticket) => (
                <SelectItem key={ticket.id} value={ticket.id}>
                  {ticket.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      ) : role ? (
        <Select
          value={personaId ?? undefined}
          onValueChange={(value) => setPersonaId(value)}
          disabled={loadingPersonas || personas.length === 0}
        >
          <SelectTrigger size="sm" className="w-[180px]" aria-label="Persona">
            <SelectValue
              placeholder={
                loadingPersonas ? "Loading personas…" : "Select persona"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {personas.map((persona) => (
              <SelectItem key={persona.id} value={persona.id}>
                {persona.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      {error ? (
        <span className="text-destructive text-xs">{error}</span>
      ) : null}
    </div>
  );
}
