import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(4000),

  CLIENT_URL: z
    .string()
    .url()
    .default("http://localhost:5173"),

  GOOGLE_CLIENT_ID: z
    .string()
    .trim()
    .min(1,"GOOGLE_CLIENT_ID is required",),

  DATABASE_URL: z.string().min(1),

  BARBERSHOP_TIME_ZONE: z
    .string()
    .default("Europe/Athens"),

  JWT_ACCESS_SECRET: z.string().min(32), //32 characters
  JWT_REFRESH_SECRET: z.string().min(32),

  ACCESS_TOKEN_EXPIRES_MINUTES: z.coerce
    .number()
    .int()
    .positive()
    .default(15),

  REFRESH_TOKEN_EXPIRES_DAYS: z.coerce
    .number()
    .int()
    .positive()
    .default(30),
});

const result = envSchema.safeParse(process.env); //examine if the rules are uploaded correctly

if (!result.success) { //if the rules are not uploaded correctly because Zod does not throw errors automatically
  console.error(
    "Invalid environment variables:",
    result.error.flatten().fieldErrors,
  );

  throw new Error("Environment validation failed");
}

export const env = result.data;