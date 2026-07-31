import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { prisma } from "./lib/prisma.js";
import { servicesRouter } from "./routes/service.route.js"
import { barbersRouter } from "./routes/barbers.routes.js";
import { appointmentsRouter } from "./routes/appointments.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { staffRouter } from "./routes/staff.routes.js";
import { adminRouter, } from "./routes/admin.routes.js";
import { env } from "./config/env.js";
import { adminBarbersRouter, } from "./routes/admin-barbers.routes.js";

const app = express();

app.set("trust proxy", 1);

const PORT = env.PORT;
const CLIENT_URL = env.CLIENT_URL;

app.use(helmet());

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/services", servicesRouter);
app.use("/api/services", servicesRouter);
app.use("/api/barbers", barbersRouter);
app.use("/api/appointments", appointmentsRouter);
app.use("/api/staff", staffRouter);
app.use("/api/admin", adminRouter);
app.use("/api/admin", adminBarbersRouter);


app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: "ok",
      message: "OraGiaKourema API is running",
      database: "connected",
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    res.status(503).json({
      status: "error",
      message: "Database connection failed",
      database: "disconnected",
    });
  }
});

async function startServer() {
  try {
    await prisma.$connect();

    app.listen(PORT, () => {
      console.log(`API running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error);
    process.exit(1);
  }
}

async function shutdown(signal: string) {
  console.log(`${signal} received. Closing server...`);

  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

void startServer();