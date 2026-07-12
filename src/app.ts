// src/app.ts — defines WHAT the app is (middleware, routes). No listening.
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(helmet());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/api/v1/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

export default app;