// src/server.ts — the entry point. Connects DB, then listens.
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";

async function start() {
  await connectDB();
  app.listen(env.PORT, () => {
    console.log(`API running on http://localhost:${env.PORT}`);
  });
}

start();