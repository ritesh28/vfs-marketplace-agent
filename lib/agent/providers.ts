import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

import {
	type AiProvider,
	PROVIDER_MODELS,
	type ProviderModelId,
	providerModelLabel,
} from "@/lib/types";

export type ProviderSelection = {
	provider: AiProvider;
	apiKey: string;
};

export type ResolvedProviderModel = {
	provider: AiProvider;
	modelId: ProviderModelId;
	label: string;
};

export function resolveProviderModel(
	selection: ProviderSelection,
): ResolvedProviderModel {
	return {
		provider: selection.provider,
		modelId: PROVIDER_MODELS[selection.provider],
		label: providerModelLabel(selection.provider),
	};
}

/** Map provider + user API key → AI SDK language model. */
export function createLanguageModel(
	selection: ProviderSelection,
): LanguageModel {
	const modelId = PROVIDER_MODELS[selection.provider];
	const apiKey = selection.apiKey.trim();

	switch (selection.provider) {
		case "openai":
			return createOpenAI({ apiKey })(modelId);
		case "gemini":
			return createGoogleGenerativeAI({ apiKey })(modelId);
		case "anthropic":
			return createAnthropic({ apiKey })(modelId);
		default: {
			const _exhaustive: never = selection.provider;
			throw new Error(`Unsupported provider: ${_exhaustive}`);
		}
	}
}
