import { readdirSync, readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import type Database from "better-sqlite3";

const DEFAULT_MIGRATIONS_DIR = resolve(process.cwd(), "migrations");

export const applyMigrations = (sqlite: Database, migrationsDir = DEFAULT_MIGRATIONS_DIR) => {
  if (!existsSync(migrationsDir)) {
    return;
  }

  const files = readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), "utf-8");
    sqlite.exec(sql);
  }
};
