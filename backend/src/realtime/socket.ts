import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { Emitter } from "@socket.io/redis-emitter";
import { Redis } from "ioredis";
import cookie from "cookie";
import { prisma } from "../shared/prisma.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

let pubClientErrorLogged = false;
let subClientErrorLogged = false;

const pubClient = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
pubClient.on("error", (err) => {
  if (!pubClientErrorLogged) {
    logger.error(`Redis pubClient error: ${err.message} (subsequent connection errors will be silenced)`);
    pubClientErrorLogged = true;
  }
});
pubClient.on("connect", () => {
  pubClientErrorLogged = false;
  logger.info("Redis pubClient connected");
});

const subClient = pubClient.duplicate();
subClient.on("error", (err) => {
  if (!subClientErrorLogged) {
    logger.error(`Redis subClient error: ${err.message} (subsequent connection errors will be silenced)`);
    subClientErrorLogged = true;
  }
});
subClient.on("connect", () => {
  subClientErrorLogged = false;
  logger.info("Redis subClient connected");
});

export const emitter = new Emitter(pubClient);

export function createSocketServer(server: HttpServer) {
  const io = new Server(server, {
    cors: {
      origin: env.FRONTEND_ORIGIN,
      credentials: true
    }
  });

  io.adapter(createAdapter(pubClient, subClient));

  io.use(async (socket, next) => {
    try {
      const cookies = cookie.parse(socket.request.headers.cookie || "");
      const sessionId = cookies.sessionId;
      if (!sessionId) return next(new Error("Authentication error"));

      const session = await prisma.userSession.findUnique({
        where: { id: sessionId },
        include: { user: true }
      });

      if (!session || session.isRevoked || session.expiresAt < new Date()) {
        return next(new Error("Authentication error"));
      }

      socket.data.user = session.user;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.user.id;
    socket.join(`user_${userId}`);
    socket.emit("realtime.connected", { connectedAt: new Date().toISOString() });
    
    socket.on("disconnect", () => {
      // Cleanup if needed
    });
  });

  return io;
}
