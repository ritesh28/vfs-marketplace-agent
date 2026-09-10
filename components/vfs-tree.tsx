"use client";

import {
  Tree,
  TreeItem,
  TreeItemLabel,
} from "@/components/reui/tree";
import { hotkeysCoreFeature, syncDataLoaderFeature } from "@headless-tree/core";
import { useTree } from "@headless-tree/react";
import {
  BracesIcon,
  FileIcon,
  FolderIcon,
  FolderOpenIcon,
} from "lucide-react";

interface FileItem {
  name: string;
  children?: string[];
  type?: "folder" | "json";
}

// Phase 1: static mock. Phase 4+: feed from lazy VFS list API / store.
const items: Record<string, FileItem> = {
  root: {
    name: "marketplace",
    children: ["sellers", "customers"],
    type: "folder",
  },
  sellers: {
    name: "sellers",
    children: ["seller-1"],
    type: "folder",
  },
  "seller-1": {
    name: "s0000000-0000-4000-8000-000000000001",
    children: ["seller-1-profile", "seller-1-products"],
    type: "folder",
  },
  "seller-1-profile": {
    name: "profile.json",
    type: "json",
  },
  "seller-1-products": {
    name: "products",
    children: ["product-1"],
    type: "folder",
  },
  "product-1": {
    name: "p0000000-0000-4000-8000-000000000001.json",
    type: "json",
  },
  customers: {
    name: "customers",
    children: ["customer-1"],
    type: "folder",
  },
  "customer-1": {
    name: "c0000000-0000-4000-8000-000000000001",
    children: ["customer-1-profile", "customer-1-orders", "customer-1-support"],
    type: "folder",
  },
  "customer-1-profile": {
    name: "profile.json",
    type: "json",
  },
  "customer-1-orders": {
    name: "orders",
    children: ["order-1"],
    type: "folder",
  },
  "order-1": {
    name: "o0000000-0000-4000-8000-000000000001.json",
    type: "json",
  },
  "customer-1-support": {
    name: "support",
    children: ["ticket-1"],
    type: "folder",
  },
  "ticket-1": {
    name: "t0000000-0000-4000-8000-000000000001.json",
    type: "json",
  },
};

const indent = 20;

export function VfsTree() {
  const tree = useTree<FileItem>({
    initialState: {
      expandedItems: ["root", "sellers", "customers"],
    },
    indent,
    rootItemId: "root",
    getItemName: (item) => item.getItemData().name,
    isItemFolder: (item) => (item.getItemData()?.children?.length ?? 0) > 0,
    dataLoader: {
      getItem: (itemId) => items[itemId],
      getChildren: (itemId) => items[itemId]?.children ?? [],
    },
    features: [syncDataLoaderFeature, hotkeysCoreFeature],
  });

  return (
    <Tree indent={indent} tree={tree} className="p-2">
      {tree.getItems().map((item) => {
        const data = item.getItemData();
        const isFolder = item.isFolder();
        const isExpanded = item.isExpanded();
        const isJson = data.type === "json" || data.name.endsWith(".json");

        return (
          <TreeItem key={item.getId()} item={item}>
            <TreeItemLabel>
              <span className="flex items-center gap-2">
                {isFolder ? (
                  isExpanded ? (
                    <FolderOpenIcon className="text-muted-foreground size-4" />
                  ) : (
                    <FolderIcon className="text-muted-foreground size-4" />
                  )
                ) : isJson ? (
                  <BracesIcon className="text-muted-foreground size-4" />
                ) : (
                  <FileIcon className="text-muted-foreground size-4" />
                )}
                <span className="truncate">{item.getItemName()}</span>
              </span>
            </TreeItemLabel>
          </TreeItem>
        );
      })}
    </Tree>
  );
}
