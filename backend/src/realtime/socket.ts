import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { env } from "../config/env.js";

export function createSocketServer(server: HttpServer) {
  const io = new Server(server, {
    cors: {
      origin: env.FRONTEND_ORIGIN,
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    socket.emit("realtime.connected", { connectedAt: new Date().toISOString() });
  });

  return io;
}
