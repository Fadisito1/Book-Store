import express from "express";
import cors from "cors";
import helmet from "helmet";
import { authRouter } from "./routes/auth";
import { errorHandler, notFound } from "./middleware/errors";

export function createApp() {
  const app = express();
  const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:3000";

  app.use(helmet());
  app.use(cors({ origin: clientOrigin, credentials: true }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api/auth", authRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
