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
        value={hydrated ? provider : "openai"}
        onValueChange={handleProviderChange}
      >
        <SelectTrigger size="sm" className="w-[140px]" aria-label="AI provider">
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
        type="password"
        value={hydrated ? apiKey : ""}
        onChange={(event) => handleApiKeyChange(event.target.value)}
        placeholder="API key"
        aria-label="API key"
        className="h-8 w-[200px]"
        autoComplete="off"
      />
    </div>
  );
}
