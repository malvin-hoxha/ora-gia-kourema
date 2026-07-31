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