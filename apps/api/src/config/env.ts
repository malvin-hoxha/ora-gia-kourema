import { z } from "zod";

const originSchema = z
  .string()
  .trim()
  .min(1)
  .transform((value, ctx) => {
    let url: URL;

    try {
      url = new URL(value);
    } catch {
      ctx.addIssue({
        code: "custom",
        message:
          "Must be a valid HTTP or HTTPS origin",
      });

      return z.NEVER;
    }

    const hasInvalidParts =
      !["http:", "https:"].includes(
        url.protocol,
      ) ||
      Boolean(url.username) ||
      Boolean(url.password) ||
      url.pathname !== "/" ||
      Boolean(url.search) ||
      Boolean(url.hash);

    if (hasInvalidParts) {
      ctx.addIssue({
        code: "custom",
        message:
          "Must contain only protocol, hostname, and optional port",
      });

      return z.NEVER;
    }

    /*
     * Converts values such as:
     * http://localhost:5173/
     *
     * into:
     * http://localhost:5173
     */
    return url.origin;
  });

const corsAllowedOriginsSchema = z
  .string()
  .trim()
  .min(
    1,
    "CORS_ALLOWED_ORIGINS is required",
  )
  .transform((value, ctx) => {
    const rawOrigins = value
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);

    if (rawOrigins.length === 0) {
      ctx.addIssue({
        code: "custom",
        message:
          "At least one CORS origin is required",
      });

      return z.NEVER;
    }

    const normalizedOrigins: string[] =
      [];

    for (const rawOrigin of rawOrigins) {
      const result =
        originSchema.safeParse(rawOrigin);

      if (!result.success) {
        ctx.addIssue({
          code: "custom",
          message:
            `Invalid CORS origin: ${rawOrigin}. ` +
            "Use only protocol, hostname, and optional port.",
        });

        return z.NEVER;
      }

      normalizedOrigins.push(
        result.data,
      );
    }

    return [
      ...new Set(normalizedOrigins),
    ];
  });

const trustProxySchema = z
  .string()
  .trim()
  .transform((value, ctx) => {
    if (value === "false") {
      return false;
    }

    const hopCount = Number(value);

    if (
      Number.isInteger(hopCount) &&
      hopCount >= 1 &&
      hopCount <= 10
    ) {
      return hopCount;
    }

    ctx.addIssue({
      code: "custom",
      message:
        "TRUST_PROXY must be false or a positive proxy hop count",
    });

    return z.NEVER;
  });

const envSchema = z
  .object({
    /*
     * No default:
     * every environment must explicitly state
     * whether it is development, test or
     * production.
     */
    NODE_ENV: z.enum([
      "development",
      "test",
      "production",
    ]),

    PORT: z.coerce
      .number()
      .int()
      .positive()
      .default(4000),

    /*
     * Canonical frontend address.
     * Used for Stripe success/cancel URLs.
     */
    FRONTEND_URL: originSchema,

    /*
     * Comma-separated exact browser origins.
     *
     * Example:
     * http://localhost:5173,http://localhost:4173
     */
    CORS_ALLOWED_ORIGINS:
      corsAllowedOriginsSchema,

    /*
     * false locally or when the API is directly
     * exposed.
     *
     * Use a number only when the production
     * proxy chain has been confirmed.
     */
    TRUST_PROXY: trustProxySchema,

    GOOGLE_CLIENT_ID: z
      .string()
      .trim()
      .min(
        1,
        "GOOGLE_CLIENT_ID is required",
      ),

    DATABASE_URL: z
      .string()
      .trim()
      .min(
        1,
        "DATABASE_URL is required",
      ),

    BARBERSHOP_TIME_ZONE: z
      .string()
      .trim()
      .default("Europe/Athens"),

    JWT_ACCESS_SECRET: z
      .string()
      .min(32),

    JWT_REFRESH_SECRET: z
      .string()
      .min(32),

    ACCESS_TOKEN_EXPIRES_MINUTES:
      z.coerce
        .number()
        .int()
        .positive()
        .default(15),

    REFRESH_TOKEN_EXPIRES_DAYS:
      z.coerce
        .number()
        .int()
        .positive()
        .default(30),

    STRIPE_SECRET_KEY: z
      .string()
      .trim()
      .regex(
        /^(sk|rk)_(test|live)_/,
        "STRIPE_SECRET_KEY must be a Stripe server-side API key",
      ),

    STRIPE_CURRENCY: z
      .enum(["eur"])
      .default("eur"),

    STRIPE_CHECKOUT_EXPIRES_MINUTES:
      z.coerce
        .number()
        .int()
        .min(30)
        .max(1440)
        .default(30),

    STRIPE_WEBHOOK_SECRET: z
      .string()
      .trim()
      .startsWith(
        "whsec_",
        "STRIPE_WEBHOOK_SECRET must start with whsec_",
      ),
  })
  .superRefine((environment, ctx) => {
    if (
      environment.NODE_ENV !==
      "production"
    ) {
      return;
    }

    if (
      !environment.FRONTEND_URL.startsWith(
        "https://",
      )
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["FRONTEND_URL"],
        message:
          "FRONTEND_URL must use HTTPS in production",
      });
    }

    environment.CORS_ALLOWED_ORIGINS.forEach(
      (origin) => {
        if (
          !origin.startsWith(
            "https://",
          )
        ) {
          ctx.addIssue({
            code: "custom",
            path: [
              "CORS_ALLOWED_ORIGINS",
            ],
            message:
              "Every production CORS origin must use HTTPS",
          });
        }
      },
    );
  });

const result = envSchema.safeParse(
  process.env,
);

if (!result.success) {
  console.error(
    "Invalid environment variables:",
    result.error.flatten().fieldErrors,
  );

  throw new Error(
    "Environment validation failed",
  );
}

export const env = result.data;