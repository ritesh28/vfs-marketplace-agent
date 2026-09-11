"use client";

import { useEffect, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type RowsResponse = {
  table: string;
  rows: Record<string, unknown>[];
};

export function DatabaseTab() {
  const [tables, setTables] = useState<string[]>([]);
  const [table, setTable] = useState<string>("");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingTables, setLoadingTables] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadTables() {
      setLoadingTables(true);
      setError(null);

      try {
        const response = await fetch("/api/db/tables");
        const data = (await response.json()) as {
          tables?: string[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load tables");
        }

        if (cancelled) {
          return;
        }

        const nextTables = data.tables ?? [];
        setTables(nextTables);
        setTable((current) => current || nextTables[0] || "");
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load tables",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingTables(false);
        }
      }
    }

    void loadTables();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!table) {
      setRows([]);
      setColumns([]);
      return;
    }

    let cancelled = false;

    async function loadRows() {
      setLoadingRows(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/db/rows?table=${encodeURIComponent(table)}`,
        );
        const data = (await response.json()) as RowsResponse & {
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load rows");
        }

        if (cancelled) {
          return;
        }

        const nextRows = data.rows ?? [];
        setRows(nextRows);
        setColumns(nextRows[0] ? Object.keys(nextRows[0]) : []);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load rows",
          );
          setRows([]);
          setColumns([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingRows(false);
        }
      }
    }

    void loadRows();

    return () => {
      cancelled = true;
    };
  }, [table]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-3">
      <Select
        value={table || undefined}
        onValueChange={setTable}
        disabled={loadingTables || tables.length === 0}
      >
        <SelectTrigger size="sm" className="w-full" aria-label="Database table">
          <SelectValue
            placeholder={loadingTables ? "Loading tables…" : "Select table"}
          />
        </SelectTrigger>
        <SelectContent>
          {tables.map((name) => (
            <SelectItem key={name} value={name}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {error ? (
        <div className="text-destructive rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
          {error}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-hidden rounded-md border">
        {loadingRows ? (
          <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
            Loading rows…
          </div>
        ) : rows.length === 0 ? (
          <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
            {table ? "No rows in this table." : "Select a table."}
          </div>
        ) : (
          <div className="h-full overflow-auto">
            <table className="w-max min-w-full border-collapse text-left text-xs">
              <thead className="bg-muted sticky top-0 z-10">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column}
                      className="border-b px-2 py-1.5 font-medium whitespace-nowrap"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index} className="odd:bg-background even:bg-muted/40">
                    {columns.map((column) => (
                      <td
                        key={column}
                        className="border-b px-2 py-1.5 align-top font-mono whitespace-nowrap"
                      >
                        {formatCell(row[column])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}
