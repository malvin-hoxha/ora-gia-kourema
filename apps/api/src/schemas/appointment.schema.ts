import { z } from "zod";

export const createAppointmentSchema = z.object({
  barberId: z.string().trim().min(1),
  serviceId: z.string().trim().min(1),

  startsAt: z.string().datetime({
    offset: true,
  }),

  notes: z
    .string()
    .trim()
    .max(500)
    .optional(),
});

export type CreateAppointmentInput = z.infer<
  typeof createAppointmentSchema
>;