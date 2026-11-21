import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import { Server } from "socket.io";

const PORT = Number(process.env.PORT) || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";

const app = express();
app.use(helmet());
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: CLIENT_ORIGIN } });
io.on("connection", (socket) => console.log("socket conectado", socket.id));

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("Falta MONGODB_URI");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB conectado");
  server.listen(PORT, "0.0.0.0", () => console.log(`API en puerto ${PORT}`));
}

main().catch((e) => {
  console.error("Error al iniciar:", e.message);
  process.exit(1);
});

