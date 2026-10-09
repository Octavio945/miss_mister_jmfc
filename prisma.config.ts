import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",

  datasource: {
    // Les commandes Prisma (db push, migrate) passent par la connexion directe si elle existe ;
    // le site, lui, utilise DATABASE_URL (pooler) via src/lib/prisma.ts.
    url: process.env.DIRECT_URL ?? env("DATABASE_URL"),
  },
});