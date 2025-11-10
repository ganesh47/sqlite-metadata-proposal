import { buildServer } from "./server.js";

const start = async () => {
  const port = Number(process.env.API_PORT ?? 8080);
  const host = process.env.API_HOST ?? "0.0.0.0";
  const app = await buildServer();

  const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];

  const shutdown = async (signal: NodeJS.Signals) => {
    app.log.info({ signal }, "Shutting down API server");
    try {
      await app.close();
      process.exit(0);
    } catch (error) {
      app.log.error(error);
      process.exit(1);
    }
  };

  signals.forEach((signal) => {
    process.once(signal, () => void shutdown(signal));
  });

  try {
    await app.listen({ port, host });
    app.log.info({ host, port }, "SQLite Metadata API ready");
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

void start();
