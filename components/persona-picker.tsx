"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPORT_PERSONA_ID, useSessionStore } from "@/lib/session-store";
import type { PersonaStub, Role, TicketStub } from "@/lib/types";

const MOCK_PERSONAS: PersonaStub[] = [
  {
    id: "c0000000-0000-4000-8000-000000000001",
    name: "Ava Customer",
    role: "customer",
  },
  {
    id: "c0000000-0000-4000-8000-000000000002",
    name: "Ben Buyer",
    role: "customer",
  },
  {
    id: "s0000000-0000-4000-8000-000000000001",
    name: "Sam Seller",
    role: "seller",
  },
  {
    id: "s0000000-0000-4000-8000-000000000002",
    name: "Rita Retail",
    role: "seller",
  },
  {
    id: SUPPORT_PERSONA_ID,
    name: "Casey Support",
    role: "support",
  },
];

const MOCK_TICKETS: TicketStub[] = [
  {
    id: "t0000000-0000-4000-8000-000000000001",
    label: "Missing item — order #1",
    customerId: "c0000000-0000-4000-8000-000000000001",
    orderId: "o0000000-0000-4000-8000-000000000001",
  },
  {
    id: "t0000000-0000-4000-8000-000000000002",
    label: "Late delivery — order #2",
    customerId: "c0000000-0000-4000-8000-000000000001",
    orderId: "o0000000-0000-4000-8000-000000000002",
  },
  {
    id: "t0000000-0000-4000-8000-000000000003",
    label: "Wrong size — order #3",
    customerId: "c0000000-0000-4000-8000-000000000002",
    orderId: "o0000000-0000-4000-8000-000000000003",
  },
];

const ROLES: Role[] = ["customer", "seller", "support"];

export function PersonaPicker() {
  const { role, personaId, ticketId, setRole, setPersonaId, setTicketId } =
    useSessionStore();

  const personasForRole = MOCK_PERSONAS.filter((persona) => persona.role === role);

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
              {id.charAt(0).toUpperCase() + id.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {role === "support" ? (
        <>
          <Select value={SUPPORT_PERSONA_ID} disabled>
            <SelectTrigger
              size="sm"
              className="w-[180px]"
              aria-label="Support persona"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SUPPORT_PERSONA_ID}>Casey Support</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={ticketId ?? undefined}
            onValueChange={(value) => setTicketId(value)}
          >
            <SelectTrigger size="sm" className="w-[240px]" aria-label="Ticket">
              <SelectValue placeholder="Select ticket" />
            </SelectTrigger>
            <SelectContent>
              {MOCK_TICKETS.map((ticket) => (
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
        >
          <SelectTrigger size="sm" className="w-[180px]" aria-label="Persona">
            <SelectValue placeholder="Select persona" />
          </SelectTrigger>
          <SelectContent>
            {personasForRole.map((persona) => (
              <SelectItem key={persona.id} value={persona.id}>
                {persona.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  );
}
