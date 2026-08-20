import "server-only";

import { neon } from "@neondatabase/serverless";

function connectionString() {
  const value = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!value) throw new Error("News automation database is not configured. Connect the Neon database and set DATABASE_URL.");
  return value;
}

export const newsSql = () => neon(connectionString());

export const isNewsDatabaseConfigured = () => Boolean(process.env.DATABASE_URL ?? process.env.POSTGRES_URL);
