import { z } from "zod";

const appointmentStatuses = [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
] as const;

export const adminAppointmentsQuerySchema =
  z.object({
    date: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "Date must use the YYYY-MM-DD format",
      )
      .optional(),

    status: z
      .enum(appointmentStatuses)
      .optional(),

    barberId: z
      .string()
      .trim()
      .min(1, "barberId is required")
      .optional(),
  });

export const adminAppointmentParamsSchema =
z.object({
  appointmentId: z
    .string()
    .trim()
    .min(
      1,
      "appointmentId is required",
    ),
});

export const updateAdminAppointmentStatusSchema =
  z.object({
    status: z.enum([
      "CONFIRMED",
      "COMPLETED",
      "CANCELLED",
      "NO_SHOW",
    ]),
  });

  export const adminServiceParamsSchema =
  z.object({
    serviceId: z
      .string()
      .trim()
      .min(
        1,
        "serviceId is required",
      ),
  });

export const createAdminServiceSchema =
  z
    .object({
      name: z
        .string()
        .trim()
        .min(
          2,
          "Service name must contain at least 2 characters",
        )
        .max(
          100,
          "Service name must contain at most 100 characters",
        ),

      description: z
        .string()
        .trim()
        .max(
          500,
          "Description must contain at most 500 characters",
        )
        .nullable()
        .optional(),

      price: z
        .number()
        .finite()
        .min(
          0,
          "Price cannot be negative",
        )
        .max(
          1000,
          "Price cannot exceed 1000",
        ),

      active: z
        .boolean()
        .optional()
        .default(true),
    })
    .strict();

export const updateAdminServiceSchema =
  z
    .object({
      name: z
        .string()
        .trim()
        .min(
          2,
          "Service name must contain at least 2 characters",
        )
        .max(
          100,
          "Service name must contain at most 100 characters",
        )
        .optional(),

      description: z
        .string()
        .trim()
        .max(
          500,
          "Description must contain at most 500 characters",
        )
        .nullable()
        .optional(),

      price: z
        .number()
        .finite()
        .min(
          0,
          "Price cannot be negative",
        )
        .max(
          1000,
          "Price cannot exceed 1000",
        )
        .optional(),

      active: z
        .boolean()
        .optional(),
    })
    .strict()
    .refine(
      (data) =>
        Object.keys(data).length > 0,
      {
        message:
          "At least one field is required",
      },
    );

    export const adminBarberParamsSchema =
  z.object({
    barberId: z
      .string()
      .trim()
      .min(
        1,
        "barberId is required",
      ),
  });