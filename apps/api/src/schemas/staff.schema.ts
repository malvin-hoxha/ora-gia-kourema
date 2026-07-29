import { z } from "zod";

export const staffAppointmentsQuerySchema =
  z.object({
    date: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "date must use the YYYY-MM-DD format",
      )
      .optional(),

    status: z
      .enum([
        "PENDING",
        "CONFIRMED",
        "COMPLETED",
        "CANCELLED",
        "NO_SHOW",
      ])
      .optional(),
  });

export const updateAppointmentStatusParamsSchema =
  z.object({
    appointmentId: z
      .string()
      .trim()
      .min(1, "appointmentId is required"),
  });

export const updateAppointmentStatusBodySchema =
  z.object({
    status: z.enum([
      "CONFIRMED",
      "COMPLETED",
      "CANCELLED",
      "NO_SHOW",
    ]),
  });