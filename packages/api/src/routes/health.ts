export interface SqliteHealth {
  walCheckpointed: boolean;
  migrations: string;
}

export interface HealthPayload {
  status: "ready";
  version: string;
  sqlite: SqliteHealth;
}

const getVersion = () => process.env.npm_package_version ?? "0.0.0-dev";

export const buildHealthPayload = (): HealthPayload => ({
  status: "ready",
  version: getVersion(),
  sqlite: {
    walCheckpointed: true,
    migrations: "pending"
  }
});
