import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

const envPath = [
  resolve(process.cwd(), "backend/.env"),
  resolve(process.cwd(), ".env"),
].find((path) => existsSync(path));

loadEnv(envPath ? { path: envPath } : undefined);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
