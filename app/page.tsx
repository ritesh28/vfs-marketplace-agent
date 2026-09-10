"use client";

import { AppHeader } from "@/components/app-header";
import { ChatPanel } from "@/components/chat-panel";
import { PersonaPicker } from "@/components/persona-picker";
import { ProviderKeyControls } from "@/components/provider-key-controls";
import { RightPanel } from "@/components/right-panel";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="bg-background flex h-svh flex-col overflow-hidden">
      <AppHeader
        controls={
          <>
            <ProviderKeyControls />
            <ThemeToggle />
          </>
        }
      />
      <PersonaPicker />
      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-2">
        <section className="min-h-0 border-b md:border-r md:border-b-0">
          <ChatPanel />
        </section>
        <section className="min-h-0">
          <RightPanel />
        </section>
      </div>
    </div>
  );
}
