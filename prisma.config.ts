// Prisma 7 configuration.
// Load .env.local first (Next.js convention — gitignored, contains real secrets),
// then fall back to .env. The Prisma CLI does NOT use Next.js env loading.
//
// Migrations use DATABASE_URL_UNPOOLED (Neon direct connection) to avoid
// pgBouncer transaction-mode limitations during schema changes.
// Runtime queries use DATABASE_URL (pooled) via PrismaClient({ datasourceUrl }).
import * as dotenv from "dotenv";
import { defineConfig } from "prisma/config";

dotenv.config({ path: ".env.local" }); // real secrets (gitignored)
dotenv.config({ path: ".env" });        // fallback / CI overrides (also gitignored)

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL_UNPOOLED"] ?? process.env["DATABASE_URL"] ?? "",
  },
});
