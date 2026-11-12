import "server-only";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import ws from "ws";
import { getServerEnv } from "@/server/config/env";
import { BoundaryError } from "@/server/auth/errors";
import * as schema from "./schema";

export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

export async function withDatabase<T>(operation: (database: Database) => Promise<T>): Promise<T> {
  const { DATABASE_URL } = getServerEnv();
  if (!DATABASE_URL) {
    throw new BoundaryError(503, "PROVIDER_UNCONFIGURED", "The project database is not configured.");
  }
  neonConfig.webSocketConstructor = ws;
  // Interactive bootstrap transactions require the Pool/WebSocket driver, not neon-http.
  // A pool belongs to this request and is closed before a serverless invocation finishes.
  const pool = new Pool({ connectionString: DATABASE_URL, max: 2, connectionTimeoutMillis: 10_000 });
  try {
    return await operation(drizzle(pool, { schema }));
  } finally {
    await pool.end();
  }
}
