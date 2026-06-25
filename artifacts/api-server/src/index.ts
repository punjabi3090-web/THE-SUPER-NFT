import app from "./app";
import { logger } from "./lib/logger";
import { seedAdmin } from "./routes/nft";

const port = Number(process.env.PORT || 3000);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${process.env.PORT}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");
  seedAdmin().then(() => logger.info("Admin seeded")).catch(e => logger.error({ err: e }, "Seed failed"));
});
