import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import "dotenv/config";
import http from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { createApp } from "./app";
import { seedAdmin } from "./services/seedAdmin";

const PORT = Number(process.env.PORT) || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";

const app = createApp();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: CLIENT_ORIGIN, credentials: true } });
app.locals.io = io;

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Token requerido"));
  if (!process.env.JWT_SECRET) return next(new Error("Configuración JWT incompleta"));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET) as jwt.JwtPayload & { role: "cliente" | "admin" };
    socket.data.userId = payload.sub;
    socket.data.role = payload.role;
    next();
  } catch {
    next(new Error("Token inválido"));
  }
});

io.on("connection", (socket) => {
  if (socket.data.role === "admin") socket.join("admin");
  if (socket.data.userId) socket.join(`user:${socket.data.userId}`);
  console.log("socket autenticado conectado", socket.id);
});

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("Falta MONGODB_URI");
  if (!process.env.JWT_SECRET) throw new Error("Falta JWT_SECRET");

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB conectado");
  await seedAdmin();
  console.log("Seed de administrador verificado");

  server.listen(PORT, "0.0.0.0", () => console.log(`API en puerto ${PORT}`));
}

main().catch((error) => {
  console.error("Error al iniciar:", error instanceof Error ? error.message : error);
  process.exit(1);
});

