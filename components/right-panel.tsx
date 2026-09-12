"use client";

import { useState } from "react";

import { DatabaseTab } from "@/components/database-tab";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type VfsFilePreview, VfsTree } from "@/components/vfs-tree";

export function RightPanel() {
	const [preview, setPreview] = useState<VfsFilePreview | null>(null);

	return (
		<Tabs
			className="flex h-full min-h-0 flex-col gap-0"
			defaultValue="vfs"
			onValueChange={() => setPreview(null)}
		>
			<div className="border-b px-3 py-2">
				<TabsList variant="line">
					<TabsTrigger value="vfs">VFS</TabsTrigger>
					<TabsTrigger value="database">Database</TabsTrigger>
				</TabsList>
			</div>
			<TabsContent
				className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden"
				value="vfs"
			>
				<div className="min-h-0 flex-1">
					<ScrollArea className="h-full">
						<VfsTree
							onFileOpen={(next) => {
								setPreview(next);
							}}
						/>
					</ScrollArea>
				</div>
				{preview ? (
					<div className="shrink-0 border-t bg-background px-3 py-3">
						<div className="mb-2 flex items-center gap-2">
							<p className="min-w-0 flex-1 truncate font-mono text-muted-foreground text-xs">
								{preview.path}
							</p>
							<Button
								className="shrink-0"
								onClick={() => setPreview(null)}
								size="sm"
								type="button"
								variant="ghost"
							>
								Close
							</Button>
						</div>
						<pre className="max-h-48 overflow-auto rounded-md bg-muted p-3 font-mono text-xs leading-relaxed">
							{preview.content}
						</pre>
					</div>
				) : null}
			</TabsContent>
			<TabsContent
				className="mt-0 min-h-0 flex-1 overflow-hidden"
				value="database"
			>
				<DatabaseTab />
			</TabsContent>
		</Tabs>
	);
}
