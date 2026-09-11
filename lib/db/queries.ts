import { db } from "@/lib/db";
import {
  dbTableNames,
  tableMap,
  type DbTableName,
} from "@/lib/db/schema";

export function listTableNames(): DbTableName[] {
  return [...dbTableNames];
}

export function isDbTableName(value: string): value is DbTableName {
  return dbTableNames.includes(value as DbTableName);
}

export async function getTableRows(table: DbTableName) {
  const tableRef = tableMap[table];
  return db.select().from(tableRef);
}
