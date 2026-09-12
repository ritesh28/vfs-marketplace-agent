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
import { type AiProvider, providerModelLabel } from "@/lib/types";

const PROVIDERS: AiProvider[] = ["openai", "gemini", "anthropic"];

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
				<SelectTrigger aria-label="AI provider" className="w-[260px]" size="sm">
					<SelectValue placeholder="Provider" />
				</SelectTrigger>
				<SelectContent>
					{PROVIDERS.map((id) => (
						<SelectItem key={id} value={id}>
							{providerModelLabel(id)}
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
