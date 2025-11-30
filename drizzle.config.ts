import { defineConfig } from "drizzle-kit";

// Provide a minimal `process` declaration to satisfy TypeScript in this config file.
declare const process: { env: { DATABASE_URL?: string } };

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});