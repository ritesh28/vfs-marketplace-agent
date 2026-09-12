import { notifyProviderSettingsChanged } from "@/lib/client-events";
import type { AiProvider } from "@/lib/types";

const PROVIDER_KEY = "vfs-marketplace:ai-provider";
const API_KEY_KEY = "vfs-marketplace:ai-api-key";

const PROVIDERS: AiProvider[] = ["openai", "gemini", "anthropic"];

function canUseStorage() {
	return (
		typeof window !== "undefined" && typeof window.localStorage !== "undefined"
	);
}

export function isAiProvider(value: string): value is AiProvider {
	return PROVIDERS.includes(value as AiProvider);
}

export function loadProvider(): AiProvider {
	if (!canUseStorage()) {
		return "openai";
	}

	const stored = window.localStorage.getItem(PROVIDER_KEY);
	return stored && isAiProvider(stored) ? stored : "openai";
}

export function saveProvider(provider: AiProvider) {
	if (!canUseStorage()) {
		return;
	}

	window.localStorage.setItem(PROVIDER_KEY, provider);
	notifyProviderSettingsChanged();
}

export function loadApiKey(): string {
	if (!canUseStorage()) {
		return "";
	}

	return window.localStorage.getItem(API_KEY_KEY) ?? "";
}

export function saveApiKey(apiKey: string) {
	if (!canUseStorage()) {
		return;
	}

	window.localStorage.setItem(API_KEY_KEY, apiKey);
	notifyProviderSettingsChanged();
}

export function loadProviderSettings(): {
	provider: AiProvider;
	apiKey: string;
} {
	return {
		provider: loadProvider(),
		apiKey: loadApiKey(),
	};
}
