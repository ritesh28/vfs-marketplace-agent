"use client";

import { useEffect, useState } from "react";

import { ErrorNotice } from "@/components/error-notice";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { readJson, requestErrorMessage } from "@/lib/read-json";
import { useSessionStore } from "@/lib/session-store";
import {
	type Persona,
	ROLES,
	type Role,
	type TicketSummary,
} from "@/lib/types";

export function PersonaPicker() {
	const { role, personaId, ticketId, setRole, setPersonaId, setTicketId } =
		useSessionStore();

	const [personas, setPersonas] = useState<Persona[]>([]);
	const [tickets, setTickets] = useState<TicketSummary[]>([]);
	const [loadingPersonas, setLoadingPersonas] = useState(false);
	const [loadingTickets, setLoadingTickets] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [retryToken, setRetryToken] = useState(0);

	useEffect(() => {
		if (!role) {
			setPersonas([]);
			return;
		}

		let cancelled = false;

		async function loadPersonas() {
			const selectedRole = role;
			if (!selectedRole) {
				return;
			}

			setLoadingPersonas(true);
			setError(null);

			try {
				const response = await fetch(
					`/api/personas?role=${encodeURIComponent(selectedRole)}`,
				);
				const data = await readJson<Persona[]>(response);

				if (!cancelled) {
					setPersonas(data);

					// Support has a single DB persona — auto-select from API, not seed IDs.
					if (selectedRole === "SUPPORT" && data[0]) {
						setPersonaId(data[0].id);
					}
				}
			} catch (loadError) {
				if (!cancelled) {
					setPersonas([]);
					setError(requestErrorMessage(loadError));
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
	}, [role, retryToken]);

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
				const data = await readJson<TicketSummary[]>(response);

				if (!cancelled) {
					setTickets(data);
				}
			} catch (loadError) {
				if (!cancelled) {
					setTickets([]);
					setError(requestErrorMessage(loadError));
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
	}, [role, retryToken]);

	const supportPersona = personas[0];

	return (
		<div className="flex flex-wrap items-center gap-2 border-b px-4 py-2">
			<Select
				onValueChange={(value) => setRole(value as Role)}
				value={role ?? undefined}
			>
				<SelectTrigger aria-label="Role" className="w-[140px]" size="sm">
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
					<Select disabled value={personaId ?? supportPersona?.id}>
						<SelectTrigger
							aria-label="Support persona"
							className="w-[180px]"
							size="sm"
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
						disabled={loadingTickets || tickets.length === 0}
						onValueChange={(value) => setTicketId(value)}
						value={ticketId ?? undefined}
					>
						<SelectTrigger aria-label="Ticket" className="w-[280px]" size="sm">
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
					disabled={loadingPersonas || personas.length === 0}
					onValueChange={(value) => setPersonaId(value)}
					value={personaId ?? undefined}
				>
					<SelectTrigger aria-label="Persona" className="w-[180px]" size="sm">
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
				<ErrorNotice
					message={error}
					onRetry={() => setRetryToken((current) => current + 1)}
					retrying={loadingPersonas || loadingTickets}
				/>
			) : null}
		</div>
	);
}
