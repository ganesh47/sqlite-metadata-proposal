import { mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import Database from "better-sqlite3";

const dbPath = process.env.SQLITE_PATH ?? resolve(process.cwd(), "data/metadata.sqlite");
const dbDir = dirname(dbPath);
mkdirSync(dbDir, { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.transaction(() => {
  const orgId = process.env.SEED_ORG_ID ?? "demo-org";
  const nodeStmt = db.prepare(
    `INSERT OR IGNORE INTO graph_nodes (
      id, org_id, type, properties, created_by, updated_by
    ) VALUES (?, ?, ?, json(?), ?, ?)`
  );
  nodeStmt.run("root", orgId, "workspace", JSON.stringify({ name: "Demo Workspace" }), "seed", "seed");

  const jobStmt = db.prepare(
    `INSERT OR IGNORE INTO migration_jobs (
      job_id, org_id, source, status, metrics
    ) VALUES (?, ?, ?, ?, json(?))`
  );
  jobStmt.run("seed-job", orgId, "seed-script", "succeeded", JSON.stringify({ nodes: 1, edges: 0 }));
})();

console.log(`Seed data inserted for database ${dbPath}`);
