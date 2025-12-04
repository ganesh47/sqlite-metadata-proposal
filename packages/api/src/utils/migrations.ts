import { readdirSync, readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import type BetterSqlite3 from "better-sqlite3";

const DEFAULT_MIGRATIONS_DIR = fileURLToPath(new URL("../../migrations", import.meta.url));

type SqliteDatabase = BetterSqlite3.Database;

const resolveMigrationsDir = (requested?: string) => {
  const candidates = [
    requested,
    process.env.MIGRATIONS_DIR,
    resolve(process.cwd(), "migrations"),
    resolve(process.cwd(), "packages/api/migrations"),
    DEFAULT_MIGRATIONS_DIR,
  ];

  return candidates.find((candidate) => candidate && existsSync(candidate));
};

export const applyMigrations = (sqlite: SqliteDatabase, migrationsDir?: string) => {
  const dir = resolveMigrationsDir(migrationsDir);
  if (!dir) {
    return;
  }

  const files = readdirSync(dir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = readFileSync(join(dir, file), "utf-8");
    sqlite.exec(sql);
  }
};
