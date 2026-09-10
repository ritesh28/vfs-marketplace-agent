"use client";

import { useState } from "react";

import { DatabaseTab } from "@/components/database-tab";
import { VfsTree, type VfsFilePreview } from "@/components/vfs-tree";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function RightPanel() {
  const [preview, setPreview] = useState<VfsFilePreview | null>(null);

  return (
    <Tabs
      defaultValue="vfs"
      className="flex h-full min-h-0 flex-col gap-0"
      onValueChange={() => setPreview(null)}
    >
      <div className="border-b px-3 py-2">
        <TabsList variant="line">
          <TabsTrigger value="vfs">VFS</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent
        value="vfs"
        className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <div
          className="min-h-0 flex-1"
          onClick={() => setPreview(null)}
        >
          <ScrollArea className="h-full">
            <VfsTree
              onFileOpen={(next) => {
                setPreview(next);
              }}
            />
          </ScrollArea>
        </div>
        {preview ? (
          <div
            className="bg-background shrink-0 border-t px-3 py-3"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-muted-foreground mb-2 truncate font-mono text-xs">
              {preview.path}
            </p>
            <pre className="bg-muted max-h-48 overflow-auto rounded-md p-3 font-mono text-xs leading-relaxed">
              {preview.content}
            </pre>
          </div>
        ) : null}
      </TabsContent>
      <TabsContent value="database" className="mt-0 min-h-0 flex-1 overflow-hidden">
        <DatabaseTab />
      </TabsContent>
    </Tabs>
  );
}
