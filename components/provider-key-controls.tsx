"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	loadProviderSettings,
	saveApiKey,
	saveProvider,
} from "@/lib/provider-storage";
import type { AiProvider } from "@/lib/types";

const PROVIDER_LABELS: Record<AiProvider, string> = {
	openai: "OpenAI",
	gemini: "Gemini",
	anthropic: "Anthropic",
};

export function ProviderKeyControls() {
	const [provider, setProvider] = useState<AiProvider>("openai");
	const [apiKey, setApiKey] = useState("");
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		const settings = loadProviderSettings();
		setProvider(settings.provider);
		setApiKey(settings.apiKey);
		setHydrated(true);
	}, []);

	function handleProviderChange(value: string) {
		const next = value as AiProvider;
		setProvider(next);
		saveProvider(next);
	}

	function handleApiKeyChange(value: string) {
		setApiKey(value);
		saveApiKey(value);
	}

	return (
		<div className="flex flex-wrap items-center justify-end gap-2">
			<Select
				onValueChange={handleProviderChange}
				value={hydrated ? provider : "openai"}
			>
				<SelectTrigger aria-label="AI provider" className="w-[140px]" size="sm">
					<SelectValue placeholder="Provider" />
				</SelectTrigger>
				<SelectContent>
					{(Object.keys(PROVIDER_LABELS) as AiProvider[]).map((id) => (
						<SelectItem key={id} value={id}>
							{PROVIDER_LABELS[id]}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<Input
				aria-label="API key"
				autoComplete="off"
				className="h-8 w-[200px]"
				onChange={(event) => handleApiKeyChange(event.target.value)}
				placeholder="API key"
				type="password"
				value={hydrated ? apiKey : ""}
			/>
		</div>
	);
}
