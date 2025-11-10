import { startServer } from "./server.js";

const bootstrap = async () => {
  try {
    await startServer();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

void bootstrap();
