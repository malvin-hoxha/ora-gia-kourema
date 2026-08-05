import "dotenv/config";
import cookieParser from "cookie-parser";
import cors, { type CorsOptions } from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { adminBarbersRouter } from "./routes/admin-barbers.routes.js";
import { adminRouter } from "./routes/admin.routes.js";
import { appointmentsRouter } from "./routes/appointments.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { barbersRouter } from "./routes/barbers.routes.js";
import { servicesRouter } from "./routes/service.route.js";
import { staffRouter } from "./routes/staff.routes.js";
import { stripeWebhookRouter } from "./routes/stripe-webhook.routes.js";

export const app = express();

app.set("trust proxy", env.TRUST_PROXY);

const allowedOrigins = new Set(
  env.CORS_ALLOWED_ORIGINS,
);

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    /*
     * Requests without an Origin header include
     * server-to-server requests, Stripe webhooks,
     * curl and local tooling.
     */
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    /*
     * Do not throw a generic server error.
     * Simply omit CORS permission for an
     * unapproved browser origin.
     */
    callback(null, false);
  },
  credentials: true,
  methods: [
    "GET",
    "HEAD",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
  ],
  allowedHeaders: ["Content-Type"],
  optionsSuccessStatus: 204,
  maxAge: 600,
};

app.use(helmet());
app.use(cors(corsOptions));

/*
 * Stripe webhook must receive the untouched
 * raw body before express.json() parses it.
 */
app.use(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhookRouter,
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
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
