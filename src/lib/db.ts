/**
 * Prisma client singleton — Prisma 7 + Neon serverless Postgres.
 *
 * Prisma 7 (prisma-client generator) requires a database adapter instead of
 * a datasourceUrl string. We use @prisma/adapter-pg with a pg connection pool.
 *
 * Use DATABASE_URL (pooled Neon endpoint) for application queries.
 * DATABASE_URL_UNPOOLED is used by prisma.config.ts for migrations only.
 *
 * NEVER import PrismaClient at module scope in multiple files.
 * Always import `db` from this file.
 *
 * @see https://pris.ly/d/prisma7-client-config
 */

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Create .env.local with your Neon connection string.",
    );
  }

  const pool = new Pool({
    connectionString,
    // Neon serverless: keep connections lean in serverless environments
    max: process.env.NODE_ENV === "production" ? 5 : 2,
    idleTimeoutMillis: 30_000,
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
