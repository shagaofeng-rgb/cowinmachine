import "server-only";

import { neon } from "@neondatabase/serverless";

function connectionString() {
  const value = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!value) throw new Error("The B2B operations database is not configured. Set DATABASE_URL or POSTGRES_URL.");
  return value;
}

export const adminSql = () => neon(connectionString());
export const isAdminDatabaseConfigured = () => Boolean(process.env.DATABASE_URL ?? process.env.POSTGRES_URL);
