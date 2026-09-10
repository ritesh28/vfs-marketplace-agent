"use client";

import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MOCK_TABLES = [
  "sellers",
  "customers",
  "support_users",
  "products",
  "orders",
  "order_items",
  "tickets",
  "ticket_messages",
  "events",
] as const;

export function DatabaseTab() {
  const [table, setTable] = useState<string>(MOCK_TABLES[0]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-3">
      <Select value={table} onValueChange={setTable}>
        <SelectTrigger size="sm" className="w-full" aria-label="Database table">
          <SelectValue placeholder="Select table" />
        </SelectTrigger>
        <SelectContent>
          {MOCK_TABLES.map((name) => (
            <SelectItem key={name} value={name}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="text-muted-foreground flex min-h-0 flex-1 items-center justify-center rounded-md border border-dashed text-sm">
        No rows yet — Database tab will load live data in Phase 2.
      </div>
    </div>
  );
}
