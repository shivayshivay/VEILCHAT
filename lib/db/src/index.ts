import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.warn(
    "[db] DATABASE_URL is not set — database features are disabled. " +
      "Set DATABASE_URL to enable database-backed routes."
  );
}

export const pool = dbUrl ? new Pool({ connectionString: dbUrl }) : null;
export const db = dbUrl ? drizzle(pool as pg.Pool, { schema }) : null;

export { eq, and, or, sql, asc, desc, inArray, isNull, isNotNull, ne } from "drizzle-orm";

export * from "./schema";
