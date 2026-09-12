import type { ReactNode } from "react";

export function AppHeader({ controls }: { controls?: ReactNode }) {
	return (
		<header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b px-4">
			<h1 className="font-bold font-brand text-2xl tracking-tight sm:text-[1.75rem]">
				VFS Marketplace Agent
			</h1>
			<div className="flex min-w-0 items-center gap-2">{controls}</div>
		</header>
	);
}
