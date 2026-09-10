"use client";

import { DatabaseTab } from "@/components/database-tab";
import { VfsTree } from "@/components/vfs-tree";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function RightPanel() {
  return (
    <Tabs defaultValue="database" className="flex h-full min-h-0 flex-col gap-0">
      <div className="border-b px-3 py-2">
        <TabsList variant="line">
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="vfs">VFS</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="database" className="mt-0 min-h-0 overflow-hidden">
        <DatabaseTab />
      </TabsContent>
      <TabsContent value="vfs" className="mt-0 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <VfsTree />
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}
