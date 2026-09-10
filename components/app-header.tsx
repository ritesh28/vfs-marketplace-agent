import type { ReactNode } from "react";

export function AppHeader({ controls }: { controls?: ReactNode }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b px-4">
      <h1 className="text-sm font-semibold tracking-tight">
        VFS Marketplace Agent
      </h1>
      <div className="flex min-w-0 items-center gap-2">{controls}</div>
    </header>
  );
}
