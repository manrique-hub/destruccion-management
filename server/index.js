import "dotenv/config";
import express from "express";
import cors from "cors";
import { query } from "./db.js";
import { ensureSchema } from "./setup/schema.js";
import { authRouter } from "./routes/auth.routes.js";
import { bootstrapRouter } from "./routes/bootstrap.routes.js";
import { actasRouter } from "./routes/actas.routes.js";
import { usersRouter } from "./routes/users.routes.js";
import { notificationsRouter } from "./routes/notifications.routes.js";
import { ApiError } from "./utils/errors.js";

const app = express();
const port = Number(process.env.API_PORT || 4000);
const startedAt = Date.now();

app.use(cors());
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    await query("SELECT 1 AS ok");
    res.json({
      ok: true,
      db: "connected",
      uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ ok: false, db: "error", detail: error.message });
  }
});

app.use("/api/bootstrap", bootstrapRouter);
app.use("/api/auth", authRouter);
app.use("/api/actas", actasRouter);
app.use("/api/users", usersRouter);
app.use("/api/notificaciones", notificationsRouter);

app.use((err, _req, res, _next) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message, code: err.code || null });
  }

  return res.status(500).json({ error: "Error interno", detail: err?.message || "Unknown" });
});

ensureSchema()
  .then(() => {
    app.listen(port, () => {
      console.log(`API lista en http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("No se pudo iniciar la API:", error.message);
    process.exit(1);
  });
