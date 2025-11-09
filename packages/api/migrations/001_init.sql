-- Graph nodes table
CREATE TABLE IF NOT EXISTS graph_nodes (
  id TEXT NOT NULL,
  org_id TEXT NOT NULL,
  type TEXT NOT NULL,
  properties TEXT NOT NULL DEFAULT '{}',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  user_agent TEXT,
  client_ip TEXT,
  job_id TEXT,
  PRIMARY KEY (org_id, id)
);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_org_type ON graph_nodes(org_id, type);

-- Graph edges table
CREATE TABLE IF NOT EXISTS graph_edges (
  id TEXT NOT NULL,
  org_id TEXT NOT NULL,
  source_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  type TEXT NOT NULL,
  properties TEXT NOT NULL DEFAULT '{}',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  job_id TEXT,
  PRIMARY KEY (org_id, id),
  FOREIGN KEY (org_id, source_id) REFERENCES graph_nodes(org_id, id) ON DELETE CASCADE,
  FOREIGN KEY (org_id, target_id) REFERENCES graph_nodes(org_id, id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_graph_edges_org_source ON graph_edges(org_id, source_id);
CREATE INDEX IF NOT EXISTS idx_graph_edges_org_target ON graph_edges(org_id, target_id);

-- Migration jobs
CREATE TABLE IF NOT EXISTS migration_jobs (
  job_id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  source TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  metrics TEXT DEFAULT '{}',
  image_digest TEXT,
  logs_url TEXT
);

-- Connector configs
CREATE TABLE IF NOT EXISTS connector_configs (
  connector_id TEXT NOT NULL,
  org_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  config TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  last_heartbeat DATETIME,
  PRIMARY KEY (org_id, connector_id)
);
