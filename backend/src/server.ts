import http from "http";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { createApp } from "./app.js";
import { createSocketServer } from "./realtime/socket.js";

const app = createApp();
const server = http.createServer(app);
createSocketServer(server);

server.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "DevPulse API listening");
});
