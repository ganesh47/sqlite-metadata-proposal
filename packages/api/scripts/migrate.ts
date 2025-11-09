import { readdirSync, readFileSync, mkdirSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import Database from "better-sqlite3";

const dbPath = process.env.SQLITE_PATH ?? resolve(process.cwd(), "data/metadata.sqlite");
const migrationsDir = resolve(import.meta.dirname, "../migrations");
const dbDir = dirname(dbPath);
mkdirSync(dbDir, { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const files = readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".sql"))
  .sort();

for (const file of files) {
  const sql = readFileSync(join(migrationsDir, file), "utf-8");
  console.log(`\nApplying migration: ${file}`);
  db.exec(sql);
}

console.log(`Migrations applied successfully to ${dbPath}`);
