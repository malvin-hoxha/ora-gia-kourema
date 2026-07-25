import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .trim() //excludes spaces
    .min(2, "Name must contain at least 2 characters")
    .max(80, "Name cannot exceed 80 characters"),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("A valid email is required"),

  phone: z
    .string()
    .trim()
    .min(8)
    .max(20)
    .optional(),

  password: z
    .string()
    .min(8, "Password must contain at least 8 characters")
    .max(128, "Password is too long")
    .regex(
      /[a-z]/,
      "Password must contain a lowercase letter",
    )
    .regex(
      /[A-Z]/,
      "Password must contain an uppercase letter",
    )
    .regex(
      /\d/,
      "Password must contain a number",
    ),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("A valid email is required"),

  password: z
    .string()
    .min(1, "Password is required"),
});