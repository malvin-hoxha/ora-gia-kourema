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

export const googleLoginSchema =
  z
    .object({
      credential: z
        .string()
        .trim()
        .min(
          1,
          "Google credential is required",
        )
        .max(
          10_000,
          "Google credential is too large",
        ),
    })
    .strict();

export const googleAccountLinkSchema =
  z
    .object({
      credential: z
        .string()
        .trim()
        .min(
          1,
          "Google credential is required",
        )
        .max(
          10_000,
          "Google credential is too large",
        ),

      /*
       * Δεν κάνουμε trim το password.
       * Τα κενά μπορεί θεωρητικά να αποτελούν
       * μέρος του πραγματικού password.
       */
      password: z
        .string()
        .min(
          1,
          "Password is required",
        )
        .max(
          128,
          "Password is too long",
        ),
    })
    .strict();