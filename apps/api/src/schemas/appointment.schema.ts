import { z } from "zod";

export const createAppointmentSchema = z.object({
  barberId: z
    .string()
    .trim()
    .min(1, "barberId is required"),

  serviceId: z
    .string()
    .trim()
    .min(1, "serviceId is required"),

  startsAt: z.string().datetime({
    offset: true,
    message:
      "startsAt must be a valid ISO datetime with timezone offset",
  }),

  notes: z
    .string()
    .trim()
    .max(500, "Notes cannot exceed 500 characters")
    .optional(),

  paymentMethod: z
    .enum([
      "PAY_AT_STORE",
      "STRIPE",
    ])
    .default("PAY_AT_STORE"),
});

export const cancelAppointmentParamsSchema = z.object({
  appointmentId: z
    .string()
    .trim()
    .min(1, "appointmentId is required"),
});

export type CreateAppointmentInput = z.infer<
  typeof createAppointmentSchema
>;